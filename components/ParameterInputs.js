import * as React from 'react';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, Link, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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

  const [inputElement, setInputElement] = React.useState(null);
  const [value, setValue] = React.useState(null);

  React.useEffect(() => {
    if (config.type) {
      if (Array.isArray(config.type)) {
        // TODO
        setInputElement(<Typography>multiple</Typography>);
      } else {
        switch (config.type) {
          case 'array':
            let itemType = "string";
            if (config.items) {
              if (config.items.type) {
                itemType = config.items.type;
              } else if (config.items["$ref"]) {
                itemType = "$ref";
                console.log("$ref:", config.items["$ref"]);
                console.log('resolved ref:', lookupRef(config.items["$ref"]));
              }
            }

            // TODO Handle patternProperties

            if (itemType === "string") {
              setInputElement(
                <StringInput
                  multiline
                  choices={config?.items?.enum}
                  pattern={config?.items?.pattern}
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
                minimum={config?.minimum}
                maximum={config?.maximum}
                isRequired={isRequired}
                setValue={setValue}
              />
            );

            break;
          case 'object':
            // TODO
            setInputElement(
              <ObjectInput
                config={config}
                title={name}
                isRequired={isRequired}
                setValue={setValue}
              />
            );
            break;
          case 'string':
            setInputElement(
              <StringInput
                choices={config?.enum}
                isRequired={isRequired}
                setValue={setValue}
              />
            );
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
      setInputElement(<Typography>oneOf</Typography>);
      // TODO
    } else {
      // TODO
      console.log('unknown input:', config);
      setInputElement(<Typography>unknown</Typography>);
    }
  }, [config, isRequired, value, setValue, setInputElement]);

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
  const {config, title, isRequired, setValue} = props;

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(null);

  // TODO Handle patternProperties

  return (
    config.properties ? (
      <React.Fragment>
        <Button onClick={() => setOpen(true)}>Configure</Button>
        <ObjectDialog
          title={title}
          properties={config.properties}
          requiredProperties={config.required}
          setProperty={setInputValue}
          open={open}
          onClose={() => setOpen(false)}
        />
      </React.Fragment>
    ) : (
      <StringInput
        choices={config?.enum}
        pattern={config?.pattern}
        isRequired={isRequired}
        setValue={setInputValue}
      />
    )
  );
}

export function ObjectDialog(props) {
  const {title, properties, requiredProperties, setProperty, open, onClose} = props;

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <PropertiesTable
          properties={properties}
          requiredProperties={requiredProperties}
          setProperty={setProperty}
        />
      </DialogContent>
      <DialogActions>
        <Button>Cancel</Button>
        <Button>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
