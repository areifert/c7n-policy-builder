import * as React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CollapsibleSection from './CollapsibleSection';

import c7n_schema from '../public/c7n-schema.json';


export const allServiceNames = Object.keys(c7n_schema.definitions.resources);

export function getServiceConfig(serviceName) {
  return c7n_schema.definitions.resources[serviceName];
}

export function getServiceActions(serviceName) {
  const commonActions = c7n_schema.definitions.actions;
  Object.keys(commonActions).map((action) => {
    commonActions[action].actionType = 'common';
  });

  const serviceActions = getServiceConfig(serviceName).actions;
  Object.keys(serviceActions).map((action) => {
    serviceActions[action].actionType = 'service';
  });

  return {
    ...commonActions,
    ...serviceActions
  };
}

export function getServiceFilters(serviceName) {
  const commonFilters = c7n_schema.definitions.filters;
  Object.keys(commonFilters).map((filter) => {
    if (commonFilters[filter] === null) {
      delete commonFilters[filter];
      return;
    }

    commonFilters[filter].filterType = 'common';
  });

  const serviceFilters = getServiceConfig(serviceName).filters;
  Object.keys(serviceFilters).map((filter) => {
    serviceFilters[filter].filterType = 'service';
  });

  return {
    ...commonFilters,
    ...serviceFilters
  };
}

export function ServiceSelector(props) {
  const { expanded, onChange, services, setServices } = props;

  const handleClick = (e) => {
    setServices((services) => {
      const service = e.target.textContent;

      return {
        ...services,
        [service]: {
          ...services[service],
          selected: !services[service].selected
        }
      }
    });
  };

  return (
    <CollapsibleSection
      title='Services'
      includeCount
      data={services}
      onClick={handleClick}
      expanded={expanded}
      onChange={onChange}
    />
  );
}

export function ActionsAndFiltersSelector(props) {
  const { expanded, onChange, services, setServices } = props;

  const setActions = (service, action) => {
    setServices((services) => {
      return {
        ...services,
        [service]: {
          ...services[service],
          actions: {
            ...services[service].actions,
            ...action
          }
        }
      }
    });
  };

  const setFilters = (service, f) => {
    setServices((services) => {
      return {
        ...services,
        [service]: {
          ...services[service],
          filters: {
            ...services[service].filters,
            ...f
          }
        }
      }
    });
  };

  return (
    <Accordion disabled={Object.keys(services).filter(service => services[service].selected).length === 0} expanded={expanded} onChange={onChange}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography sx={{ width: '33%', flexShrink: 0 }}>Actions and Filters</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {Object.keys(services).filter(service => services[service].selected).map((service) => {
          const actionData = Object.keys(services[service].actions).length > 0 ? services[service].actions : getServiceActions(service);
          const filterData = Object.keys(services[service].filters).length > 0 ? services[service].filters : getServiceFilters(service);

          return (
            <React.Fragment key={service}>
              <Typography variant='overline'>{service}</Typography>

              <CollapsibleSection
                title='Actions'
                includeCount
                data={actionData}
                dataSegments={[
                  {
                    filterFunction: (a) => actionData[a].actionType === 'service'
                  },
                  {
                    title: 'Common Actions',
                    filterFunction: (a) => actionData[a].actionType === 'common'
                  }
                ]}
                onClick={(e) => {
                  const action = e.target.textContent;

                  setActions(service, {
                    ...actionData,
                    [action]: {
                      ...actionData[action],
                      selected: actionData[action] ? !actionData[action].selected : true
                    }
                  });
                }}
              />

              <CollapsibleSection
                title='Filters'
                includeCount
                data={filterData}
                dataSegments={[
                  {
                    filterFunction: (f) => filterData[f].filterType === 'service'
                  },
                  {
                    title: 'Common Filters',
                    filterFunction: (f) => filterData[f].filterType === 'common'
                  }
                ]}
                onClick={(e) => {
                  const f = e.target.textContent;

                  setFilters(service, {
                    ...filterData,
                    [f]: {
                      ...filterData[f],
                      selected: filterData[f] ? !filterData[f].selected : true
                    }
                  });
                }}
              />
            </React.Fragment>
          );
        })}
      </AccordionDetails>
    </Accordion>
  );
}

/* Property types:
"array"
"boolean"
"integer"
"number"
"object"
"string"
*/
