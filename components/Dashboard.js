import * as React from 'react';
import { createTheme, useTheme, ThemeProvider } from '@mui/material/styles';
import { AppBar, Badge, Button, ButtonGroup, Box, Container, CssBaseline, Grid, IconButton, Link, Paper, Toolbar, Tooltip,
  Typography, FormGroup, FormControlLabel, Switch, ToggleButton, ToggleButtonGroup, TextField, useMediaQuery } from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { stringify } from 'yaml';

import { NewService } from './SchemaItems';

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © Your Website ' + new Date().getFullYear() + '.'}
      &ensp;&bull;&ensp;
      <Link
        color="inherit"
        underline="hover"
        href="https://github.com/areifert/c7n-policy-builder"
        target="_blank"
        rel="noopener"
      >
        GitHub
      </Link>
    </Typography>
  );
}

function DashboardContent() {
  const [selectedServices, setSelectedServices] = React.useState([null]);
  const [tooltipTitle, setTooltipTitle] = React.useState('Copy');
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [policyFormat, setPolicyFormat] = React.useState('yaml');

  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  const handlePolicyImport = (e) => {
    console.log(e.target.files[0]);
    // TODO
  };

  const generateNewCustodianPolicy = React.useCallback(() => {
    const policies = {
      policies: selectedServices.filter(s => s !== null).map((service) => {
        const serviceName = Object.keys(service)[0];

        // TODO Add support for "description", "mode", and "conditions"

        /* TODO Allow users to use generic filters, e.g.:
        filters:
        - "tag:Name": xyz
        - State.Name: running
        */

        return {
          name: service[serviceName].name,
          resource: serviceName.split('.').pop(),
          actions: service[serviceName].actions.filter(v => v !== null).map(v => v.values),
          filters: service[serviceName].filters.filter(v => v !== null).map(v => v.values)
        };
      })
    };

    return policyFormat === 'yaml' ? stringify(policies) : JSON.stringify(policies, null, 2)
  }, [policyFormat, selectedServices]);

  const copyPolicyToClipboard = React.useCallback(() => {
    navigator.clipboard.writeText(generateNewCustodianPolicy());

    setTooltipTitle('Copied!');
  }, [generateNewCustodianPolicy, setTooltipTitle]);

  const setServiceAtIndex = (index, config) => {
    setSelectedServices((existingServices) => {
      existingServices[index] = config;
      return Array.from(existingServices);
    });
  };

  const deleteServiceAtIndex = (index) => {
    setSelectedServices((existingServices) => {
      existingServices[index] = null;
      if (index > 0 && index === (existingServices.length - 1)) {
        existingServices.pop();
      }

      if (existingServices.every(v => v === null)) {
        // Reduce to one-element array
        existingServices = [null];
      }

      return Array.from(existingServices);
    });
  };

  React.useEffect(() => {
    console.log('selected services changed:', selectedServices);
  }, [selectedServices]);

  return (
    <Box sx={{
      height: '100vh',
      backgroundColor: (theme) =>
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : theme.palette.grey[900],
    }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography
            component="div"
            variant="h6"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Cloud Custodian Policy Builder
          </Typography>
          <IconButton
            sx={{ mr: 1 }}
            onClick={colorMode.toggleColorMode}
            color="inherit"
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Button component='label' variant='outlined' color='inherit' startIcon={<FileUploadOutlinedIcon />}>
            <input hidden accept=".json,.yaml,.yml" type="file" onChange={handlePolicyImport} />
            Import policy
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{ flexGrow: 1 }}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item sm={6} sx={{maxHeight: '80vh', overflowY: 'auto'}}>
              {selectedServices.map((serviceConfig, serviceIndex) => {
                // Ignore any deleted services, unless it's the last one in the list
                if (serviceConfig === null && serviceIndex < (selectedServices.length - 1)) {
                  return <React.Fragment key={serviceIndex} />;
                }

                // Exclude all services that are already selected
                const excludedServices = selectedServices.filter((v, i) => v !== null && i !== serviceIndex).map(v => Object.keys(v)[0]);

                return (
                  <Paper key={serviceIndex} sx={{padding: 3}}>
                    <NewService
                      deleteMe={() => deleteServiceAtIndex(serviceIndex)}
                      excludedServices={excludedServices}
                      setSelectedService={(config) => setServiceAtIndex(serviceIndex, config)}
                    />
                  </Paper>
                )
              })}

              {selectedServices.at(-1) !== null &&
                <Button sx={{margin: 1}} onClick={() => setSelectedServices((previous) => { previous.push(null); return Array.from(previous); })}>
                  Add another service
                </Button>
              }
            </Grid>

            <Grid item sm={6} sx={{maxHeight: '80vh', overflowY: 'auto'}}>
              <Paper sx={{ backgroundColor: 'black' }}>
                <Box sx={{width: '100%', textAlign: 'end'}}>
                  <ToggleButtonGroup exclusive color='standard' value={policyFormat} onChange={(e, newValue) => { if (newValue !== null) { setPolicyFormat(newValue) } }}>
                    <ToggleButton value='json' color='warning' sx={{color: 'white', borderColor: 'white'}}>json</ToggleButton>
                    <ToggleButton value='yaml' color='warning' sx={{color: 'white', borderColor: 'white'}}>yaml</ToggleButton>
                  </ToggleButtonGroup>

                  <Tooltip
                    open={tooltipOpen}
                    title={tooltipTitle}
                    onOpen={() => setTooltipOpen(true)}
                    onClose={() => { setTooltipOpen(false); setTimeout(() => { setTooltipTitle('Copy') }, 500); }}
                  >
                    <IconButton onClick={copyPolicyToClipboard}>
                      <ContentCopyOutlinedIcon sx={{ color: 'white' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'light'
                        ? theme.palette.primary.contrastText
                        : '',
                    fontFamily: 'monospace',
                    padding: '.5rem 1rem',
                    whiteSpace: 'pre',
                    wordWrap: 'break-word',
                  }}
                >
                  {generateNewCustodianPolicy()}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <Copyright sx={{ pt: 4 }} />
        </Container>
      </Box>
    </Box>
  );
}

export default function Dashboard() {
  const [mode, setMode] = React.useState('light');
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
    }),
    [],
  );

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <DashboardContent />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
