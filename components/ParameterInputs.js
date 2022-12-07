import * as React from 'react';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, Link, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { lookupRef } from './SchemaItems';

export function PropertiesTable(props) {
  // TODO Add an option to allow new properties to be added by the user (for free-form objects)
  const { properties, requiredProperties, setProperty, isExtensible } = props;

  const [customProperties, setCustomProperties] = React.useState([]);

  // TODO Handle additionalProperties
  const getSortedProperties = React.useCallback(() => {
    let sortedProperties = [];
    if (properties) {
      sortedProperties = Object.keys(properties);
      sortedProperties.sort((a, b) => {
        if (requiredProperties) {
          if (requiredProperties.includes(a) && !requiredProperties.includes(b)) {
            return -1;
          } else if (requiredProperties.includes(b) && !requiredProperties.includes(a)) {
            return 1;
          }
        }

        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        } else {
          return 0;
        }
      });
    }

    return sortedProperties;
  }, [properties, requiredProperties]);

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
          {getSortedProperties().map((property) => (
            <NewParameter
              key={property}
              name={property}
              config={properties[property]}
              isRequired={requiredProperties && requiredProperties.includes(property)}
              setProperty={setProperty}
            />
          ))}

          {/* {customProperties.map((property) => (
            <NewParameter
              key={property}
              name={property}
              config={properties[property]}
              isRequired={requiredProperties && requiredProperties.includes(property)}
              setProperty={setProperty}
            />
          ))} */}
        </TableBody>
      </Table>

      {isExtensible &&
        <Button sx={{margin: 1}}>Add property</Button>
      }
    </TableContainer>
  );
}

export function NewParameter(props) {
  // TODO Allow property name to be set
  const { name, config, isRequired, setProperty } = props;

  // TODO Add description or title (if there is one) as tooltip

  return (
    <TableRow>
      <TableCell>
        <Typography variant='body2' sx={{fontFamily: 'monospace'}}>
          {name}
          {isRequired &&
            <sup>*</sup>
          }
        </Typography>
      </TableCell>
      <TableCell>
        <ParameterInput
          name={name}
          config={config}
          isRequired={isRequired}
          setProperty={(value) => setProperty(name, value)}
        />
      </TableCell>
    </TableRow>
  );
}

export function ParameterInput(props) {
  const { name, config, isRequired, setProperty } = props;

  const resolvedConfig = config["$ref"] ? lookupRef(config["$ref"]) : config;

  const [inputElement, setInputElement] = React.useState(null);
  const [value, setValue] = React.useState(null);

  React.useEffect(() => {
    if (resolvedConfig.type) {
      if (Array.isArray(resolvedConfig.type)) {
        // TODO
        setInputElement(<Typography>multiple</Typography>);
      } else {
        switch (resolvedConfig.type) {
          case 'array':
            let itemType = "string";
            if (resolvedConfig.items) {
              if (resolvedConfig.items.type) {
                itemType = resolvedConfig.items.type;
              } else if (resolvedConfig.items["$ref"]) {
                itemType = "$ref";
                console.log("$ref:", resolvedConfig.items["$ref"]);
                console.log('resolved ref:', lookupRef(resolvedConfig.items["$ref"]));
              }
            }

            // TODO Handle patternProperties

            if (itemType === "string") {
              setInputElement(
                <StringInput
                  multiline
                  choices={resolvedConfig?.items?.enum}
                  pattern={resolvedConfig?.items?.pattern}
                  isRequired={isRequired}
                  setValue={setValue}
                />
              );
            } else if (itemType in ["integer", "number"]) {
              setInputElement(
                <NumberInput
                  multiline
                  isRequired={isRequired}
                  setValue={setValue}
                />
              );
            }
            /* TODO Handle other types:
              - oneOf
              - anyOf
              - object
            */

            // TODO Handle config.minItems
            // TODO Handle config.maxItems

            break;
          case 'boolean':
            setInputElement(
              <BooleanInput
                isRequired={isRequired}
                setValue={setValue}
              />
            );
            break;
          case 'integer':
          case 'number':
            setInputElement(
              <NumberInput
                minimum={resolvedConfig?.minimum}
                maximum={resolvedConfig?.maximum}
                isRequired={isRequired}
                setValue={setValue}
              />
            );

            break;
          case 'object':
            // TODO
            setInputElement(
              <ObjectInput
                config={resolvedConfig}
                title={name}
                initialValue={value}
                isRequired={isRequired}
                setValue={setValue}
              />
            );
            break;
          case 'string':
            setInputElement(
              <StringInput
                choices={resolvedConfig?.enum}
                isRequired={isRequired}
                setValue={setValue}
              />
            );
            break;
          default:
            setInputElement(<Typography>{resolvedConfig.type}</Typography>);
            break;
        }
      }
    } else if (resolvedConfig.enum) {
      if (resolvedConfig.enum.length === 1) {
        setInputElement(<Typography>{resolvedConfig.enum[0]}</Typography>);
        setValue(resolvedConfig.enum[0]);
      } else {
        setInputElement(
          <Autocomplete
            fullWidth
            required={isRequired}
            options={resolvedConfig.enum}
            renderInput={(params) => <TextField {...params} label="Choose one..." />}
            onChange={(e, newValue) => setValue(newValue)}
          />
        );
      }

    } else if (resolvedConfig.oneOf) {
      setInputElement(<Typography>oneOf</Typography>);
      // TODO
    } else {
      // TODO
      console.log('unknown input:', resolvedConfig);
      setInputElement(<Typography>unknown</Typography>);
    }
  }, [resolvedConfig, value, setValue, setInputElement]);

  React.useEffect(() => {
    setProperty(value);
  }, [value]);

  return inputElement;
}

export function NumberInput(props) {
  const {minimum, maximum, multiline, isRequired, defaultValue, setValue} = props;

  const [inputValue, setInputValue] = React.useState(defaultValue || '');

  let helperText = '';
  if (minimum !== undefined) {
    helperText = 'Min: ' + minimum;

    if (maximum !== undefined) {
      helperText += ', max: ' + maximum;
    }
  } else if (maximum !== undefined) {
    helperText = 'Max: ' + maximum;
  }

  const numberValid = React.useCallback((value) => {
    if (value === null || value.length === 0) {
      return true;
    }

    if (/^\-?\d*\.?\d+$/.test(value)) {
      if (minimum !== undefined && value < minimum) {
        return false;
      }

      if (maximum !== undefined && value > maximum) {
        return false
      }

      return true;
    }

    return false;
  }, [maximum, minimum]);

  React.useEffect(() => {
    if (multiline) {
      setValue(inputValue.split("\n")
        .map(v => v.trim())
        .filter(v => v.length > 0 && numberValid(v))
        .map(v => Number(v))
      );
    } else {
      if (inputValue === null || inputValue.length === 0 || !numberValid(inputValue)) {
        setValue(null);
      } else {
        setValue(Number(inputValue));
      }
    }
  }, [inputValue, numberValid]);

  return (
    <TextField
      fullWidth
      multiline={multiline}
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      error={(isRequired && (inputValue === null || inputValue.length === 0)) || !numberValid(inputValue)}
      required={isRequired}
      label={multiline ? 'Enter one number per line...' : 'Number...'}
      helperText={helperText}
      defaultValue={defaultValue}
      onChange={e => setInputValue(e.target.value.trim())}
    />
  );
}

export function BooleanInput(props) {
  const {isRequired, defaultValue, setValue} = props;

  return (
    <Autocomplete
      fullWidth
      defaultValue={defaultValue}
      required={isRequired}
      options={['true', 'false']}
      renderInput={(params) => <TextField {...params} label="true / false" />}
      onChange={(e, newValue) => setValue(newValue === null ? newValue : newValue === 'true')}
    />
  );
}

export function StringInput(props) {
  const {choices, multiline, pattern, isRequired, defaultValue, setValue} = props;

  const [inputValue, setInputValue] = React.useState(defaultValue || null);

  const stringValid = React.useCallback((value) => {
    if (value === null || value.length === 0) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every(v => stringValid(v));
    }

    if (pattern) {
      return new RegExp(pattern).test(value);
    }

    return true;
  }, [pattern]);

  React.useEffect(() => {
    if (stringValid(inputValue)) {
      setValue(inputValue);
    } else {
      setValue(null);
    }
  }, [inputValue, stringValid]);

  return (
    choices ? (
      <Autocomplete
        fullWidth
        defaultValue={defaultValue}
        required={isRequired}
        options={choices}
        renderInput={(params) => <TextField {...params} label="Choose one..." />}
        onChange={(e, newValue) => setInputValue(newValue)}
      />
    ) : (
      <TextField
        fullWidth
        defaultValue={defaultValue}
        multiline={multiline}
        error={(isRequired && (inputValue === null || inputValue.length === 0)) || !stringValid(inputValue)}
        required={isRequired}
        label={multiline ? 'Enter one value per line...' : 'Value...'}
        helperText={pattern ? 'Pattern: ' + pattern : ''}
        onChange={e => {
          if (multiline) {
            setInputValue(e.target.value.split("\n")
              .map(v => v.trim())
              .filter(v => v.length > 0)
            );
          } else {
            setInputValue(e.target.value.trim());
          }
        }}
      />
    )
  );
}

export function ObjectInput(props) {
  // TODO Allow for configurable/custom objects
  const {config, title, initialValue, isRequired, setValue} = props;

  const [open, setOpen] = React.useState(false);

  // TODO Handle patternProperties

  return (
    <React.Fragment>
      <Button onClick={() => setOpen(true)}>Configure</Button>
      <ObjectDialog
        title={'Configure ' + title}
        properties={config?.properties}
        requiredProperties={config?.required}
        setProperties={(name, value) => {
          setValue((previousValue) => {
            if (previousValue === null) {
              if (value === null) {
                return previousValue;
              }

              previousValue = {};
            }

            if (value === null) {
              if (Object.keys(previousValue).includes(name)) {
                delete previousValue[name];
              }
            } else {
              previousValue[name] = value;
            }

            return {...previousValue};
          });
        }}
        open={open}
        onClose={() => setOpen(false)}
        isExtensible={config.properties ? false : true}
      />
    </React.Fragment>
  );
}

export function ObjectDialog(props) {
  const {title, properties, requiredProperties, setProperties, open, onClose, isExtensible} = props;

  return (
    <Dialog onClose={onClose} open={open} fullWidth maxWidth='sm'>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <PropertiesTable
          properties={properties}
          requiredProperties={requiredProperties}
          setProperty={setProperties}
          isExtensible={isExtensible}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
