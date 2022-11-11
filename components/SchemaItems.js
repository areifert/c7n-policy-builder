import * as React from 'react';
import { Autocomplete, Box, Divider, Grid, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import c7n_schema from '../public/c7n-schema.json';
import c7n_docs from '../public/c7n-docs.json';


export const allServiceNames = Object.keys(c7n_schema.definitions.resources);

export function getServiceConfig(serviceName) {
  return c7n_schema.definitions.resources[serviceName];
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

export function NewService(props) {
  const { deleteMe, excludeServices, setSelectedService } = props;

  const [service, setService] = React.useState(null);
  const [actionCount, setActionCount] = React.useState(1);
  const [filterCount, setFilterCount] = React.useState(1);

  const setActionAtIndex = (index, action) => {
    setService((prevService) => {
      const serviceName = Object.keys(prevService)[0];

      if (action === null) {
        prevService[serviceName].actions.splice(index, 1);
      } else {
        prevService[serviceName].actions[index] = action;
      }

      return {...prevService};
    });
  };

  const setFilterAtIndex = (index, filter) => {
    setService((prevService) => {
      const serviceName = Object.keys(prevService)[0];

      if (filter === null) {
        prevService[serviceName].filters.splice(index, 1);
      } else {
        prevService[serviceName].filters[index] = filter;
      }

      return {...prevService};
    });
  };

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
          options={allServiceNames.filter(v => !excludeServices.includes(v))}
          sx={{width: '250px', margin: 1}}
          renderInput={(params) => <TextField {...params} label="Choose a service..." />}
          onChange={onServiceNameChange}
          value={service === null ? null : Object.keys(service)[0]}
        />

        <IconButton onClick={() => { setService(null); deleteMe(); }}>
          <DeleteIcon />
        </IconButton>
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

            {service[serviceName].actions.map((v, actionIndex) => (
              <React.Fragment key={actionIndex}>
                <Divider>Actions</Divider>
                <NewActionOrFilter
                  type='action'
                  deleteMe={() => deleteActionOrFilterAtIndex('action', actionIndex)}
                  serviceName={Object.keys(service)[0]}
                  setSelectedActionOrFilter={(config) => setActionOrFilterAtIndex('action', actionIndex, config)}
                />
              </React.Fragment>
            ))}

            {service[serviceName].filters.map((v, filterIndex) => (
              <React.Fragment key={filterIndex}>
                <Divider>Filters</Divider>
                <NewActionOrFilter
                  type='filter'
                  deleteMe={() => deleteActionOrFilterAtIndex('filter', filterIndex)}
                  serviceName={Object.keys(service)[0]}
                  setSelectedActionOrFilter={(config) => setActionOrFilterAtIndex('filter', filterIndex, config)}
                />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))
      }
    </React.Fragment>
  );
}

export function NewActionOrFilter(props) {
  const { deleteMe, serviceName, setSelectedActionOrFilter, type } = props;

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
      <Box sx={{display: 'flex', flexGrow: 1, justifyContent: 'space-between'}}>
        <Autocomplete
          disableClearable
          options={type === 'action' ? getNewServiceActions(serviceName) : getNewServiceFilters(serviceName)}
          isOptionEqualToValue={(option, value) => option.label === value.label }
          sx={{width: '250px', margin: 1}}
          renderInput={(params) => <TextField {...params} label={"Choose " + (type === 'action' ? "an action" : "a filter") + "..."} />}
          onChange={(e, newValue) => setActionOrFilter(newValue)}
          value={actionOrFilter}
        />

        <IconButton onClick={() => { setActionOrFilter(null); deleteMe(); }}>
          <DeleteIcon />
        </IconButton>
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
            // setInputElement(<Typography>{config.type}</Typography>);
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
