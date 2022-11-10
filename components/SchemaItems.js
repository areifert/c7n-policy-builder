import * as React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Button, Divider, Grid, Link, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CollapsibleSection from './CollapsibleSection';

import c7n_schema from '../public/c7n-schema.json';
import c7n_docs from '../public/c7n-docs.json';


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

export function sortAutocompleteOptions(options) {
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

export function getNewServiceActions(serviceName) {
  let actions = [];

  const commonActions = c7n_schema.definitions.actions;
  const serviceActions = getServiceConfig(serviceName).actions;

  for (const action in commonActions) {
    if (!commonActions[action]?.properties) {
      continue
    }

    actions.push({
      label: action.split('.').pop(),
      name: action,
      config: {
        ...commonActions[action],
        docs: c7n_docs.common_actions[action]
      }
    });
  }

  for (const action in serviceActions) {
    if (!serviceActions[action]?.properties) {
      continue
    }

    actions.push({
      label: action,
      config: {
        ...serviceActions[action],
        docs: c7n_docs[serviceName].actions[action]
      }
    });
  }

  actions = sortAutocompleteOptions(actions);

  return actions;
}

export function getNewServiceFilters(serviceName) {
  let filters = [];

  const commonFilters = c7n_schema.definitions.filters;
  const serviceFilters = getServiceConfig(serviceName).filters;

  for (const filter in commonFilters) {
    if (!commonFilters[filter]?.properties) {
      continue
    }

    filters.push({
      label: filter.split('.').pop(),
      name: filter,
      config: {
        ...commonFilters[filter],
        docs: c7n_docs.common_filters[filter]
      }
    });
  }

  for (const filter in serviceFilters) {
    if (!serviceFilters[filter]?.properties) {
      continue
    }

    filters.push({
      label: filter,
      config: {
        ...serviceFilters[filter],
        docs: c7n_docs[serviceName].filters[filter]
      }
    });
  }

  filters = sortAutocompleteOptions(filters);

  return filters;
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

export function NewService(props) {
  const { excludeServices, setSelectedService } = props;

  const [service, setService] = React.useState(null);
  const [actionCount, setActionCount] = React.useState(1);
  const [filterCount, setFilterCount] = React.useState(1);

  const setServiceAction = (action, deleteOrAdd) => {
    setService((prevService) => {
      console.log('previous service:', prevService);
      console.log('action:', action);

      const serviceName = Object.keys(prevService)[0];

      const actionIndex = prevService[serviceName].actions.findIndex((element) => {
        console.log('findElement:', element);
        return element.label === action.label;
      });
      console.log('actionIndex:', actionIndex);
      console.log(prevService[serviceName]);

      if (deleteOrAdd === 'delete') {
        if (actionIndex === -1) {
          // Not found, nothing to do
          return prevService;
        }

        prevService[serviceName].actions.splice(actionIndex, 1);
      } else {
        if (actionIndex === -1) {
          // Not found, add it
          prevService[serviceName].actions.push(action);
        } else {
          // Update existing action
          prevService[serviceName].actions[actionIndex] = action;
        }
      }

      return {...prevService};
    });
  }

  const setActionAtIndex = (index, action) => {
    console.log('index:', index);
    console.log('action:', action);

    setService((prevService) => {
      const serviceName = Object.keys(prevService)[0];

      if (action === null) {
        prevService[serviceName].actions.splice(index, 1);
      } else {
        prevService[serviceName].actions[index] = action;
      }

      return {...prevService};
    });
  }

  const onServiceNameChange = (e, newValue) => {
    if (newValue === null) {
      setService(null);
    } else {
      setService({
        [newValue]: {
          actions: [],
          filters: []
        }
      });
    }
  }

  React.useEffect(() => {
    setSelectedService(service);
  }, [service]);

  return (
    <React.Fragment>
      <Autocomplete
        disableClearable
        options={allServiceNames}
        sx={{width: '250px', margin: 1}}
        renderInput={(params) => <TextField {...params} label="Choose a service..." />}
        onChange={onServiceNameChange}
      />

      {service &&
        <React.Fragment>
          {[...Array(actionCount).keys()].map(actionIndex => (
            <React.Fragment key={actionIndex}>
              <Divider>Actions</Divider>
              <NewAction
                serviceName={Object.keys(service)[0]}
                setSelectedAction={(config) => { setActionAtIndex(actionIndex, config) }}
                setServiceAction={setServiceAction}
              />
            </React.Fragment>
          ))}

          {[...Array(filterCount).keys()].map(filterIndex => (
            <React.Fragment key={filterIndex}>
              <Divider>Filters</Divider>
              <NewFilter serviceName={Object.keys(service)[0]} />
            </React.Fragment>
          ))}
        </React.Fragment>
      }
    </React.Fragment>
  );
}

export function NewAction(props) {
  const { serviceName, setSelectedAction, setServiceAction } = props;

  const [action, setAction] = React.useState(null);

  // Clear action if service changes
  React.useEffect(() => {
    setAction(null);
    // TODO This isn't clearing the input field
  }, [serviceName]);

  React.useEffect(() => {
    setSelectedAction(action);
  }, [action]);

  return (
    <React.Fragment>
      <Autocomplete
        disableClearable
        options={getNewServiceActions(serviceName)}
        isOptionEqualToValue={(option, value) => option.label === value.label }
        sx={{width: '250px', margin: 1}}
        renderInput={(params) => <TextField {...params} label="Choose an action..." />}
        onChange={(e, newValue) => setAction(newValue)}
      />

      {action &&
        <React.Fragment>
          {action.config.docs &&
            <React.Fragment>
              <Typography>{action.config.docs.doc}</Typography>
              <Link
                underline='none'
                href={action.config.docs.link}
                target="_blank"
                rel="noopener"
              >
                Documentation
              </Link>
              <Typography paragraph />
            </React.Fragment>
          }

          <Typography variant='overline'>Parameters</Typography>
          <Grid container>
            {Object.keys(action.config.properties).map((param) => (
              <NewParameter
                key={param}
                name={param}
                config={action.config.properties[param]}
                isRequired={action.config.required && action.config.required.includes(param)}
              />
            ))}
          </Grid>
        </React.Fragment>
      }
    </React.Fragment>
  );
}

export function NewFilter(props) {
  const { serviceName } = props;

  const [filter, setFilter] = React.useState(null);

  React.useEffect(() => {
    if (filter !== null) {
      console.log('selected filter:', filter);
    }
  }, [filter]);

  return (
    <React.Fragment>
      <Autocomplete
        disableClearable
        options={getNewServiceFilters(serviceName)}
        isOptionEqualToValue={(option, value) => option.label === value.label }
        sx={{width: '250px', margin: 1}}
        renderInput={(params) => <TextField {...params} label="Choose a filter..." />}
        onChange={(e, newValue) => setFilter(newValue)}
      />

      {filter &&
        <React.Fragment>
          {filter.config.docs &&
            <React.Fragment>
              <Typography>{filter.config.docs.doc}</Typography>
              <Link
                underline='none'
                href={filter.config.docs.link}
                target="_blank"
                rel="noopener"
              >
                Documentation
              </Link>
              <Typography paragraph />
            </React.Fragment>
          }

          <Typography variant='overline'>Parameters</Typography>
          <Grid container>
            {Object.keys(filter.config.properties).map((param) => (
              <NewParameter
                key={param}
                name={param}
                config={filter.config.properties[param]}
                isRequired={filter.config.required && filter.config.required.includes(param)}
              />
            ))}
          </Grid>
        </React.Fragment>
      }
    </React.Fragment>
  );
}

export function NewParameter(props) {
  const { name, config, isRequired } = props;

  return (
    <React.Fragment>
      <Grid item xs={4}>
        <Typography gutterBottom sx={{fontFamily: 'monospace'}}>{name}{isRequired ? ' *' : ''}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography sx={{fontFamily: 'monospace'}}>=</Typography>
      </Grid>
      <Grid item xs={4}>
        <ParameterInput config={config} isRequired={isRequired} />
        {/* <Typography>{config.type ? config.type : (config.enum ? 'enum' : 'unknown')}</Typography> */}
      </Grid>
    </React.Fragment>
  );
}

export function ParameterInput(props) {
  const { config, isRequired } = props;

  const [inputElement, setInputElement] = React.useState(null);
  const [value, setValue] = React.useState(null);

  const numberValid = (value, minimum, maximum) => {
    if (value === null || value.length === 0) {
      return true;
    }

    const number = value.trim();
    if (/^\d+$/.test(number)) {
      if (minimum !== undefined && number < minimum) {
        return false;
      }

      if (maximum !== undefined && number > maximum) {
        return false
      }

      return true;
    }

    return false;
  }

  React.useEffect(() => {
    if (config.type) {
      if (Array.isArray(config.type)) {
        // TODO
      } else {
        switch (config.type) {
          case 'array':
            setInputElement(<Typography>a</Typography>);
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
            // setInputElement(<Typography>{config.type}</Typography>);
            break;
        }
      }
    } else if (config.enum) {
      if (config.enum.length === 1) {
        setInputElement(
          <TextField
            disabled
            fullWidth
            required={isRequired}
            value={config.enum[0]}
          />
        );
      } else {
      }

    } else if (config.oneOf) {
      // TODO
    }
  }, [config, isRequired, value, setValue, setInputElement]);

  return inputElement;
}
