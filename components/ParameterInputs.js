import * as React from 'react';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, Link, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { lookupRef } from './SchemaItems';

export function PropertiesTable(props) {
  const { properties, requiredProperties, setProperty } = props;

  // TODO Handle additionalProperties

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
  }, [resolvedConfig, isRequired, value, setValue, setInputElement]);

  React.useEffect(() => {
    setProperty(value);
  }, [value]);

  return inputElement;
}

export function NumberInput(props) {
  const {minimum, maximum, multiline, isRequired, setValue} = props;

  const [inputValue, setInputValue] = React.useState(null);

  let helperText = '';
  if (minimum !== undefined) {
    helperText = 'Min: ' + minimum;

    if (maximum !== undefined) {
      helperText += ', max: ' + maximum;
    }
  } else if (maximum !== undefined) {
    helperText = 'Max: ' + maximum;
  }

  const numberValid = (value) => {
    if (value === null || value.length === 0) {
      return true;
    }

    if (/^\d*\.?\d+$/.test(value)) {
      if (minimum !== undefined && value < minimum) {
        return false;
      }

      if (maximum !== undefined && value > maximum) {
        return false
      }

      return true;
    }

    return false;
  };

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
  }, [inputValue]);

  return (
    <TextField
      fullWidth
      multiline={multiline}
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      error={(isRequired && (inputValue === null || inputValue.length === 0)) || !numberValid(inputValue)}
      required={isRequired}
      label={multiline ? 'Enter one number per line...' : 'Number...'}
      helperText={helperText}
      onChange={e => setInputValue(e.target.value.trim())}
    />
  );
}

export function BooleanInput(props) {
  const {isRequired, setValue} = props;

  return (
    <Autocomplete
      fullWidth
      required={isRequired}
      options={['true', 'false']}
      renderInput={(params) => <TextField {...params} label="true / false" />}
      onChange={(e, newValue) => setValue(newValue === null ? newValue : newValue === 'true')}
    />
  );
}

export function StringInput(props) {
  const {choices, multiline, pattern, isRequired, setValue} = props;

  const [inputValue, setInputValue] = React.useState(null);

  const stringValid = (value) => {
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
  };

  React.useEffect(() => {
    if (stringValid(inputValue)) {
      setValue(inputValue);
    } else {
      setValue(null);
    }
  }, [inputValue]);

  return (
    choices ? (
      <Autocomplete
        fullWidth
        required={isRequired}
        options={choices}
        renderInput={(params) => <TextField {...params} label="Choose one..." />}
        onChange={(e, newValue) => setInputValue(newValue)}
      />
    ) : (
      <TextField
        fullWidth
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
  const {config, title, initialValue, isRequired, setValue} = props;

  const [open, setOpen] = React.useState(false);

  // TODO Handle patternProperties

  return (
    config.properties ? (
      <React.Fragment>
        <Button onClick={() => setOpen(true)}>Configure</Button>
        <ObjectDialog
          title={'Configure ' + title}
          properties={config.properties}
          requiredProperties={config.required}
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
        />
      </React.Fragment>
    ) : (
      // TODO Free-form objects should probably have a large text field that accepts (sanitized) YAML or JSON
      <StringInput
        choices={config?.enum}
        pattern={config?.pattern}
        isRequired={isRequired}
        setValue={setValue}
      />
    )
  );
}

export function ObjectDialog(props) {
  const {title, properties, requiredProperties, setProperties, open, onClose} = props;

  return (
    <Dialog onClose={onClose} open={open} fullWidth maxWidth='sm'>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <PropertiesTable
          properties={properties}
          requiredProperties={requiredProperties}
          setProperty={setProperties}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
