import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { Accordion, AccordionSummary, AccordionDetails, Badge, Box, Checkbox, Container, CssBaseline, Divider, FormGroup, FormControlLabel, Grid, IconButton,
  Link, List, ListItemButton, ListItemText, ListSubheader, Paper, Toolbar, Tooltip, Typography, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

import { stringify } from 'yaml';

import MuiAppBar from '@mui/material/AppBar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { allServiceNames, commonActions, commonFilters, getServiceConfig, ActionsAndFiltersSelector, ServiceSelector } from './SchemaItems';

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

const drawerWidth = 0;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const mdTheme = createTheme();

function DashboardContent() {
  const [services, setServices] = React.useState(
    allServiceNames.reduce((previous, current) => (
      {
        ...previous,
        [current]: {
          selected: false,
          actions: {},
          filters: {}
        }
      }
    ), {})
  );
  const [expandedPanel, setExpandedPanel] = React.useState('services');
  const [tooltipTitle, setTooltipTitle] = React.useState('Copy');
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  const handlePanel = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const generateCustodianPolicy = React.useCallback(() => {
    const selectedServiceNames = Object.keys(services).filter(s => services[s].selected);

    return stringify({
      policies: selectedServiceNames.map((service) => {
        return {
          name: `${service} policy`,
          resource: service.split('.').pop(),
          actions: Object.keys(services[service].actions).filter(v => services[service].actions[v].selected),
          filters: Object.keys(services[service].filters).filter(v => services[service].filters[v].selected),
        };
      })
    });
  }, [services]);

  const copyPolicyToClipboard = React.useCallback(() => {
    navigator.clipboard.writeText(generateCustodianPolicy());

    setTooltipTitle('Copied!');
  }, [generateCustodianPolicy, setTooltipTitle]);

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute">
          <Toolbar>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Cloud Custodian Policy Builder
            </Typography>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <ServiceSelector
                  expanded={expandedPanel === 'services'}
                  onChange={handlePanel('services')}
                  services={services}
                  setServices={setServices}
                />
                <ActionsAndFiltersSelector
                  expanded={expandedPanel === 'actionsAndFilters'}
                  onChange={handlePanel('actionsAndFilters')}
                  services={services}
                  setServices={setServices}
                />
              </Grid>

              <Grid item xs={6}>
                <Paper sx={{backgroundColor: 'black'}}>
                  <Typography sx={{width: '100%', textAlign: 'end'}}>
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
                  </Typography>
                  <Typography
                    sx={{
                      color: mdTheme.palette.primary.contrastText,
                      fontFamily: 'monospace',
                      padding: '.5rem 1rem',
                      whiteSpace: 'pre',
                      wordWrap: 'break-word',
                    }}
                  >
                    {generateCustodianPolicy()}
                  </Typography>
                </Paper>
              </Grid>




              {/* {selectedServices.map((service, index) => {
                const serviceConfig = getServiceConfig(service);

                return (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="overline">{service}</Typography>

                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                        >
                          <Typography sx={{ width: '33%', flexShrink: 0 }}>Actions</Typography>
                          <Typography sx={{ color: 'text.secondary' }}>0 selected</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormGroup>
                            {Object.keys(serviceConfig.actions).map((action, actionIndex) => (
                              <FormControlLabel key={actionIndex} control={<Checkbox />} label={action} />
                            ))}
                            <Divider>Common Actions</Divider>
                            {commonActions.map((action, actionIndex) => (
                              <FormControlLabel key={actionIndex} control={<Checkbox />} label={action} />
                            ))}
                          </FormGroup>
                        </AccordionDetails>
                      </Accordion>
                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                        >
                          <Typography sx={{ width: '33%', flexShrink: 0 }}>Filters</Typography>
                          <Typography sx={{ color: 'text.secondary' }}>0 selected</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormGroup>
                            {Object.keys(serviceConfig.filters).map((filter, filterIndex) => (
                              <FormControlLabel key={filterIndex} control={<Checkbox />} label={filter} />
                            ))}
                            <Divider>Common Filters</Divider>
                            {commonFilters.map((filter, filterIndex) => (
                              <FormControlLabel key={filterIndex} control={<Checkbox />} label={filter} />
                            ))}
                          </FormGroup>
                        </AccordionDetails>
                      </Accordion>
                    </Paper>
                  </Grid>
                );
              })} */}
            </Grid>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
