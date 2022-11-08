import * as React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Chip, Divider, InputAdornment, ListItemButton, ListItemText,
  ListSubheader, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';

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

  const [filter, setFilter] = React.useState('');

  const handleChecked = (e) => {
    setServices((services) => {
      return {
        ...services,
        [e.target.name]: {
          ...services[e.target.name],
          selected: e.target.checked
        }
      };
    });
  };

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
    <Accordion expanded={expanded} onChange={onChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ width: '33%', flexShrink: 0 }}>Services</Typography>
        <Typography sx={{ color: 'text.secondary' }}>{allServiceNames.filter(s => services[s].selected).length} selected</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          fullWidth
          label='Filter...'
          value={filter}
          variant='outlined'
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <ClearIcon onClick={() => { setFilter('') }} />
              </InputAdornment>
            )
          }}
        />

        {allServiceNames.filter(service => service.split('.').pop().includes(filter)).map((value) => (
          <Chip
            key={value}
            label={value}
            color={services[value].selected ? 'primary' : 'default'}
            variant={services[value].selected ? 'filled' : 'outlined'}
            sx={{margin: '5px'}}
            onClick={handleClick}
            disableRipple
          />
        ))}
      </AccordionDetails>
    </Accordion>
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
        {Object.keys(services).filter(service => services[service].selected).map((service) => (
          <React.Fragment key={service}>
            <Typography variant='overline'>{service}</Typography>
            <ActionsSelector
              actions={Object.keys(services[service].actions).length > 0 ? services[service].actions : getServiceActions(service)}
              setActions={(a) => setActions(service, a) }
            />
            <FiltersSelector
              filters={Object.keys(services[service].filters).length > 0 ? services[service].filters : getServiceFilters(service)}
              setFilters={(f) => setFilters(service, f) }
            />
          </React.Fragment>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export function ActionsSelector(props) {
  const { actions, setActions } = props;

  const [filter, setFilter] = React.useState('');

  const handleClick = (e) => {
    const action = e.target.textContent;

    setActions({
      ...actions,
      [action]: {
        ...actions[action],
        selected: actions[action] ? !actions[action].selected : true
      }
    });
  };

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography sx={{ width: '33%', flexShrink: 0 }}>Actions</Typography>
        <Typography sx={{ color: 'text.secondary' }}>{Object.keys(actions).filter(a => actions[a].selected).length} selected</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          fullWidth
          label='Filter...'
          value={filter}
          variant='outlined'
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <ClearIcon onClick={() => { setFilter('') }} />
              </InputAdornment>
            )
          }}
        />

        {Object.keys(actions).filter(action => actions[action].actionType === 'service' && action.split('.').pop().includes(filter)).map((value) => (
          <Chip
            key={value}
            label={value}
            color={actions[value] && actions[value].selected ? 'primary' : 'default'}
            variant={actions[value] && actions[value].selected ? 'filled' : 'outlined'}
            sx={{margin: '5px'}}
            onClick={handleClick}
            disableRipple
          />
        ))}
        <Divider>Common Actions</Divider>
        {Object.keys(actions).filter(action => actions[action].actionType === 'common' && action.split('.').pop().includes(filter)).map((value) => (
          <Chip
            key={value}
            label={value}
            color={actions[value] && actions[value].selected ? 'primary' : 'default'}
            variant={actions[value] && actions[value].selected ? 'filled' : 'outlined'}
            sx={{margin: '5px'}}
            onClick={handleClick}
            disableRipple
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export function FiltersSelector(props) {
  const { filters, setFilters } = props;

  const [filter, setFilter] = React.useState('');

  const handleClick = (e) => {
    const f = e.target.textContent;

    setFilters({
      ...filters,
      [f]: {
        ...filters[f],
        selected: filters[f] ? !filters[f].selected : true
      }
    });
  };

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography sx={{ width: '33%', flexShrink: 0 }}>Filters</Typography>
        <Typography sx={{ color: 'text.secondary' }}>{Object.keys(filters).filter(f => filters[f].selected).length} selected</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          fullWidth
          label='Filter...'
          value={filter}
          variant='outlined'
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <ClearIcon onClick={() => { setFilter('') }} />
              </InputAdornment>
            )
          }}
        />

        {Object.keys(filters).filter(f => filters[f].filterType === 'service' && f.split('.').pop().includes(filter)).map((value) => (
          <Chip
            key={value}
            label={value}
            color={filters[value] && filters[value].selected ? 'primary' : 'default'}
            variant={filters[value] && filters[value].selected ? 'filled' : 'outlined'}
            sx={{margin: '5px'}}
            onClick={handleClick}
            disableRipple
          />
        ))}
        <Divider>Common Filters</Divider>
        {Object.keys(filters).filter(f => filters[f].filterType === 'common' && f.split('.').pop().includes(filter)).map((value) => (
          <Chip
            key={value}
            label={value}
            color={filters[value] && filters[value].selected ? 'primary' : 'default'}
            variant={filters[value] && filters[value].selected ? 'filled' : 'outlined'}
            sx={{margin: '5px'}}
            onClick={handleClick}
            disableRipple
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
