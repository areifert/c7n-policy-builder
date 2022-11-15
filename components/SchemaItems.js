import * as React from 'react';
import { Autocomplete, Box, Button, Divider, Grid, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import c7n_schema from '../public/c7n-schema.json';
import c7n_docs from '../public/c7n-docs.json';


export const allServiceNames = Object.keys(c7n_schema.definitions.resources);

export function getServiceConfig(serviceName) {
  return c7n_schema.definitions.resources[serviceName];
}

export function getServicePolicies(serviceName) {
  return getServiceConfig(serviceName).policy.allOf.filter(v => Object.keys(v).includes('properties'));
}

function sortAutocompleteOptions(options) {
  options.sort((a, b) => {
    const labelA = a.label.toLowerCase();
    const labelB = b.label.toLowerCase();

    if (labelA < labelB) {
      return -1;
    } else if (labelA > labelB) {
      return 1;
    } else {
      return 0;
    }
  });

  return options
    .filter((v, i, self) => i === self.findIndex((element) => element.label === v.label))
    .filter(v => 'properties' in v.config);
}

function lookupRef(ref) {
  const refPath = ref.split('/');
  let resolvedRef;
  for (let i = 0; i < refPath.length; i++) {
    const pathElement = refPath[i];
    if (pathElement === '#') {
      resolvedRef = c7n_schema;
    } else {
      resolvedRef = resolvedRef[pathElement];
    }
  }

  return resolvedRef;
}

export function getPropertiesForType(type, serviceName) {
  let properties = [];
  const servicePolicies = getServicePolicies(serviceName);
  let commonDocs, propertyType;
  if (type === 'action') {
    commonDocs = c7n_docs.common_actions;
    propertyType = 'actions';
  } else {
    commonDocs = c7n_docs.common_filters;
    propertyType = 'filters';
  }

  for (let i = 0; i < servicePolicies.length; i++) {
    const refList = servicePolicies[i].properties[propertyType].items.anyOf.filter(v => Object.keys(v).includes("$ref"));
    for (let j = 0; j < refList.length; j++) {
      const config = lookupRef(refList[j]["$ref"]);
      const name = refList[j]["$ref"].split('/').pop();

      properties.push({
        label: name.split('.').pop(),
        config: {
          ...config,
          docs: c7n_docs[serviceName][propertyType][name] || commonDocs[name]
        }
      });
    }
  }

  // TODO Also need to support comparison operators (-and, -or, etc.)

  return sortAutocompleteOptions(properties);
}

export function NewService(props) {
  const { deleteMe, excludedServices, setSelectedService } = props;

  const [service, setService] = React.useState(null);

  const setActionOrFilterAtIndex = (type, index, config) => {
    setService((prevService) => {
      const serviceName = Object.keys(prevService)[0];

      let arrayRef;
      if (type === 'action') {
        arrayRef = prevService[serviceName].actions;
      } else {
        arrayRef = prevService[serviceName].filters;
      }

      arrayRef[index] = config;
      return {...prevService};
    });
  };

  const addActionOrFilter = (type) => {
    setService((prevService) => {
      const serviceName = Object.keys(prevService)[0];

      let arrayRef;
      if (type === 'action') {
        arrayRef = prevService[serviceName].actions;
      } else {
        arrayRef = prevService[serviceName].filters;
      }

      arrayRef.push(null);
      return {...prevService};
    });
  };

  const deleteActionOrFilterAtIndex = (type, index) => {
    setService((prevService) => {
      const serviceName = Object.keys(prevService)[0];

      let arrayRef;
      if (type === 'action') {
        arrayRef = prevService[serviceName].actions;
      } else {
        arrayRef = prevService[serviceName].filters;
      }

      arrayRef[index] = null;
      if (index > 0 && index === (arrayRef.length - 1)) {
        arrayRef.pop();
      }

      if (arrayRef.every(v => v === null)) {
        // Reduce to one-element array
        while (arrayRef.length > 1) {
          arrayRef.pop();
        }
      }

      return {...prevService};
    });
  };

  const setPolicyName = (name) => {
    setService((prevService) => {
      const serviceName = Object.keys(prevService)[0];
      prevService[serviceName].name = name;
      return {...prevService};
    });
  };

  const onServiceNameChange = (e, newValue) => {
    if (newValue === null) {
      setService(null);
    } else {
      setService({
        [newValue]: {
          name: `My ${newValue.split('.').pop()} policy`,
          actions: [null],
          filters: [null]
        }
      });
    }
  };

  React.useEffect(() => {
    setSelectedService(service);
  }, [service]);

  return (
    <React.Fragment>
      <Box sx={{display: 'flex', flexGrow: 1, justifyContent: 'space-between'}}>
        <Autocomplete
          disableClearable
          options={allServiceNames}
          getOptionDisabled={option => excludedServices.includes(option)}
          sx={{width: '250px', margin: 1}}
          renderInput={(params) => <TextField {...params} label="Choose a service..." />}
          onChange={onServiceNameChange}
          value={service === null ? null : Object.keys(service)[0]}
        />

        {service !== null &&
          <IconButton onClick={() => { setService(null); deleteMe(); }}>
            <DeleteIcon />
          </IconButton>
        }
      </Box>

      {service &&
        Object.keys(service).map((serviceName) => (
          <React.Fragment key={serviceName}>
            <TextField
              label='Policy name'
              sx={{width: '325px', mt: 3, mb: 3, ml: 1, mr: 1}}
              onChange={e => setPolicyName(e.target.value.trim())}
              value={service[serviceName].name}
            />

            <Divider>Actions</Divider>
            {service[serviceName].actions.map((v, actionIndex) => {
              // Ignore any deleted actions, unless it's the last one in the list
              if (v === null && actionIndex < (service[serviceName].actions.length - 1)) {
                return <React.Fragment key={actionIndex} />;
              }

              return (
                <NewActionOrFilter
                  key={actionIndex}
                  type='action'
                  deleteMe={() => deleteActionOrFilterAtIndex('action', actionIndex)}
                  excludedOptions={service[serviceName].actions.filter((v, i) => v !== null && i !== actionIndex).map(v => v.label)}
                  serviceName={Object.keys(service)[0]}
                  setSelectedActionOrFilter={(config) => setActionOrFilterAtIndex('action', actionIndex, config)}
                />
              );
            })}
            {Object.values(service)[0].actions.at(-1) !== null &&
              <Button onClick={() => addActionOrFilter('action')}>
                Add another action
              </Button>
            }

            <Divider>Filters</Divider>
            {service[serviceName].filters.map((v, filterIndex) => {
              // Ignore any deleted actions, unless it's the last one in the list
              if (v === null && filterIndex < (service[serviceName].filters.length - 1)) {
                return <React.Fragment key={actionIndex} />;
              }

              return (
                <NewActionOrFilter
                  key={filterIndex}
                  type='filter'
                  deleteMe={() => deleteActionOrFilterAtIndex('filter', filterIndex)}
                  excludedOptions={service[serviceName].filters.filter((v, i) => v !== null && i !== filterIndex).map(v => v.label)}
                  serviceName={Object.keys(service)[0]}
                  setSelectedActionOrFilter={(config) => setActionOrFilterAtIndex('filter', filterIndex, config)}
                />
              );
            })}
            {Object.values(service)[0].filters.at(-1) !== null &&
              <Button onClick={() => addActionOrFilter('filter')}>
                Add another filter
              </Button>
            }
          </React.Fragment>
        ))
      }
    </React.Fragment>
  );
}

export function NewActionOrFilter(props) {
  const { deleteMe, excludedOptions, serviceName, setSelectedActionOrFilter, type } = props;

  const [actionOrFilter, setActionOrFilter] = React.useState(null);

  // Clear value if service changes
  React.useEffect(() => {
    setActionOrFilter(null);
  }, [serviceName]);

  React.useEffect(() => {
    setSelectedActionOrFilter(actionOrFilter);
  }, [actionOrFilter]);

  const setProperty = (property, value) => {
    setActionOrFilter((previous) => {
      if (!previous.values) {
        previous.values = {};
      }

      if (value === null || value.length === 0) {
        if (property in previous.values) {
          delete previous.values[property];
        } else {
          return previous;
        }
      } else {
        previous.values[property] = value;
      }

      return {...previous};
    });
  };

  return (
    <React.Fragment>
      <Box sx={{display: 'flex', flexGrow: 1, justifyContent: 'space-between', mt: 2}}>
        <Autocomplete
          disableClearable
          options={getPropertiesForType(type, serviceName)}
          getOptionDisabled={(option) => excludedOptions.includes(option.label)}
          isOptionEqualToValue={(option, value) => option.label === value.label }
          sx={{width: '250px', margin: 1}}
          renderInput={(params) => <TextField {...params} label={"Choose " + (type === 'action' ? "an action" : "a filter") + "..."} />}
          onChange={(e, newValue) => setActionOrFilter(newValue)}
          value={actionOrFilter}
        />

        {actionOrFilter !== null &&
          <IconButton onClick={() => { setActionOrFilter(null); deleteMe(); }}>
            <DeleteIcon />
          </IconButton>
        }
      </Box>

      {actionOrFilter &&
        <React.Fragment>
          {actionOrFilter.config.docs &&
            <React.Fragment>
              <Typography>{actionOrFilter.config.docs.doc}</Typography>
              <Link
                underline='none'
                href={actionOrFilter.config.docs.link}
                target="_blank"
                rel="noopener"
              >
                Documentation
              </Link>
              <Typography paragraph />
            </React.Fragment>
          }

          <PropertiesTable
            properties={actionOrFilter.config.properties}
            requiredProperties={actionOrFilter.config.required}
            setProperty={setProperty}
          />
        </React.Fragment>
      }
    </React.Fragment>
  );
}

export function PropertiesTable(props) {
  const { properties, requiredProperties, setProperty } = props;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(properties).map((property) => (
            <NewParameter
              key={property}
              name={property}
              config={properties[property]}
              isRequired={requiredProperties && requiredProperties.includes(property)}
              setProperty={setProperty}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function NewParameter(props) {
  const { name, config, isRequired, setProperty } = props;

  return (
    <TableRow>
      <TableCell sx={{fontFamily: 'monospace'}}>{name}{isRequired ? ' *' : ''}</TableCell>
      <TableCell>
        <ParameterInput
          config={config}
          isRequired={isRequired}
          setProperty={(value) => setProperty(name, value)}
        />
      </TableCell>
    </TableRow>
  );
}

export function ParameterInput(props) {
  const { config, isRequired, setProperty } = props;

  const [inputElement, setInputElement] = React.useState(null);
  const [value, setValue] = React.useState(null);

  const numberValid = (value, minimum, maximum) => {
    if (value === null || value.length === 0) {
      return true;
    }

    const number = value.trim();
    if (/^\d*\.?\d+$/.test(number)) {
      if (minimum !== undefined && number < minimum) {
        return false;
      }

      if (maximum !== undefined && number > maximum) {
        return false
      }

      return true;
    }

    return false;
  };


  React.useEffect(() => {
    if (config.type) {
      if (Array.isArray(config.type)) {
        // TODO
        setInputElement(<Typography>multiple</Typography>);
      } else {
        switch (config.type) {
          case 'array':
            // TODO
            let itemType;
            if (config.items) {
              if (config.items.type) {
                itemType = config.items.type;
              } else if (config.items["$ref"]) {
                itemType = "$ref";
                console.log("$ref:", config.items["$ref"]);
                console.log('resolved ref:', lookupRef(config.items["$ref"]));
              }
            }

            // TODO Handle config.minItems

            // This should work for simple items (strings, numbers, etc.), need something more for objects
            setInputElement(
              <TextField
                fullWidth
                multiline
                maxRows={3}
                label="Enter one value per line..."
                error={isRequired && (value === null || value.length === 0)}
                required={isRequired}
                onChange={e => setValue(e.target.value.split("\n").map(v => v.trim()).filter(v => v.length > 0))}
              />
            );

            break;
          case 'boolean':
            setInputElement(
              <Autocomplete
                fullWidth
                required={isRequired}
                options={['true', 'false']}
                renderInput={(params) => <TextField {...params} label="true / false" />}
                onChange={(e, newValue) => setValue(newValue === null ? newValue : newValue === 'true')}
              />
            );
            break;
          case 'integer':
          case 'number':
            let helperText = '';
            if (config?.minimum !== undefined) {
              helperText = 'Min: ' + config.minimum;

              if (config?.maximum !== undefined) {
                helperText += ', max: ' + config.maximum;
              }
            } else if (config?.maximum !== undefined) {
              helperText = 'Max: ' + config.maximum;
            }

            setInputElement(
              <TextField
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                error={isRequired && (value === null || value.length === 0) || !numberValid(value, config?.minimum, config?.maximum)}
                required={isRequired}
                label='Number...'
                helperText={helperText}
                onChange={e => setValue(e.target.value.trim())}
              />
            );

            break;
          case 'object':
            // TODO
            setInputElement(<Typography>object</Typography>);
            break;
          case 'string':
            if (config.enum) {
              setInputElement(
                <Autocomplete
                  fullWidth
                  required={isRequired}
                  options={config.enum}
                  renderInput={(params) => <TextField {...params} label="Choose one..." />}
                  onChange={(e, newValue) => setValue(newValue)}
                />
              );
            } else {
              setInputElement(
                <TextField
                  fullWidth
                  error={isRequired && (value === null || value.length === 0)}
                  required={isRequired}
                  label='Value...'
                  onChange={e => setValue(e.target.value.trim())}
                />
              );
            }
            break;
          default:
            setInputElement(<Typography>{config.type}</Typography>);
            break;
        }
      }
    } else if (config.enum) {
      if (config.enum.length === 1) {
        setInputElement(<Typography>{config.enum[0]}</Typography>);
        setValue(config.enum[0]);
      } else {
        setInputElement(
          <Autocomplete
            fullWidth
            required={isRequired}
            options={config.enum}
            renderInput={(params) => <TextField {...params} label="Choose one..." />}
            onChange={(e, newValue) => setValue(newValue)}
          />
        );
      }

    } else if (config.oneOf) {
      // TODO
    }
  }, [config, isRequired, value, setValue, setInputElement]);

  React.useEffect(() => {
    setProperty(value);
  }, [value]);

  return inputElement;
}
