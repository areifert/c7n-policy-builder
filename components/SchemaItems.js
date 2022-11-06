import * as React from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

import c7n_schema from '../public/c7n-schema.json';


export const commonActions = Object.keys(c7n_schema.definitions.actions);
export const commonFilters = Object.keys(c7n_schema.definitions.filters);

export function getServiceConfig(service_name) {
  return c7n_schema.definitions.resources[service_name];
}

export function SchemaItems(props) {
  const { setSelectedServices } = props;

  return (
    <React.Fragment>
      <ListSubheader component="div" inset>
        Available services
      </ListSubheader>
      {Object.keys(c7n_schema.definitions.resources).map((value, index) => (
        <ListItemButton key={index} onClick={() => {
          setSelectedServices((services) => {
            if (!services.includes(value)) {
              services.push(value);
              services.sort();
              return Array.from(services);
            } else {
              return services;
            }
          })
        }}>
          <ListItemText primary={value} />
        </ListItemButton>
      ))}
    </React.Fragment>
  )
}
