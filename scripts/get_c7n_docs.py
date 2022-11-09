from bs4 import BeautifulSoup
import json
from multiprocessing import Pool
import requests

docs_base_url = 'https://cloudcustodian.io/docs/aws/resources'


def get_resource_docs(resource_name, resource_config):
    docs = {
        'actions': {},
        'filters': {}
    }

    print(f'getting docs for resource \'{resource_name}\'...')

    service_name = resource_name.split('.')[-1]

    r = requests.get(f'{docs_base_url}/{service_name}.html')
    r.raise_for_status()

    soup = BeautifulSoup(r.text, 'html.parser')

    for doc_type in ['actions', 'filters']:
        for name in resource_config[doc_type].keys():
            section = soup.find(id=name)
            if section is None:
                continue

            docs[doc_type][name] = {
                'doc': '\n'.join([p.string if p.string is not None else '' for p in section.find_all('p')]),
                'link': f'{r.request.url}#{resource_name.replace(".", "-")}-{doc_type}-{name}'
            }

    return {resource_name: docs}

def get_common_actions_and_filters(actions, filters):
    docs = {
        'common_actions': {},
        'common_filters': {}
    }

    for x in [('common_actions', actions), ('common_filters', filters)]:
        (doc_type, entries) = x
        url_base_path = f'aws-{doc_type.replace("_", "-")}'

        r = requests.get(f'{docs_base_url}/{url_base_path}.html')
        r.raise_for_status()

        soup = BeautifulSoup(r.text, 'html.parser')

        for entry in entries:
            entry_id = entry.split('.')[-1]
            section = soup.find(id=entry_id)
            if section is None:
                continue

            docs[doc_type][entry] = {
                'doc': '\n'.join([p.string if p.string is not None else '' for p in section.find_all('p')]),
                'link': f'{r.request.url}#{url_base_path}-{entry_id}'
            }

    return docs


if __name__ == '__main__':
    with open('../public/c7n-schema.json') as f:
        custodian_schema = json.load(f)

    aws_resources = custodian_schema['definitions']['resources']

    documentation = {}

    with Pool() as p:
        results = p.starmap(get_resource_docs, aws_resources.items())

    for result in results:
        documentation.update(result)

    documentation.update(
        get_common_actions_and_filters(
            custodian_schema['definitions']['actions'],
            custodian_schema['definitions']['filters']
        )
    )

    output_file = '../public/c7n-docs.json'
    with open(output_file, 'w') as f:
        json.dump(documentation, f, indent=2)

    print('output written to file:', output_file)
