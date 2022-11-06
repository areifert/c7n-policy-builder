import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { Accordion, AccordionSummary, AccordionDetails, Badge, Box, Checkbox, Container, CssBaseline, Divider, FormGroup, FormControlLabel, Grid, IconButton,
  Link, List, ListItemButton, ListItemText, ListSubheader, Paper, Toolbar, Typography, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { commonActions, commonFilters, getServiceConfig, SchemaItems } from './SchemaItems';

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

const drawerWidth = 240;

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

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      maxHeight: '100vh',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

const mdTheme = createTheme();

function DashboardContent() {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };
  const [selectedServices, setSelectedServices] = React.useState([]);

  React.useEffect(() => {
    console.log('selected services:', selectedServices);
  }, [selectedServices]);

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
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
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          {selectedServices.length > 0 &&
            <React.Fragment>
              <Divider />
              <List component="nav">
                <ListSubheader component="div" inset>
                  Selected services
                </ListSubheader>
                {selectedServices.map((service, index) => (
                  <ListItemButton key={index} onClick={() => {
                    setSelectedServices((services) => {
                      services.splice(services.findIndex((value) => value === service), 1)
                      return Array.from(services);
                    });
                  }}>
                    <ListItemText primary={service} />
                  </ListItemButton>
                ))}
              </List>
            </React.Fragment>
          }
          <Divider />
          <List component="nav">
            <SchemaItems setSelectedServices={setSelectedServices} />
          </List>
        </Drawer>
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
              {selectedServices.map((service, index) => {
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
                              // <Typography key={actionIndex}>{action}</Typography>
                            ))}
                            <Divider>Common Actions</Divider>
                            {commonActions.map((action, actionIndex) => (
                              <FormControlLabel key={actionIndex} control={<Checkbox />} label={action} />
                              // <Typography key={actionIndex}>{action}</Typography>
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

                      {/* <Divider>Actions</Divider>
                      {Object.keys(serviceConfig.actions).concat(commonActions).map((action, actionIndex) => (
                        <Chip key={actionIndex} label={action} variant="outlined" onClick={() => {console.log('click')}} />
                        // <Typography key={actionIndex}>{action}</Typography>
                      ))} */}

                      {/* <Divider>Filters</Divider>
                      {Object.keys(serviceConfig.filters).concat(commonFilters).map((filter, filterIndex) => (
                        <Typography key={filterIndex} variant="caption">{filter}</Typography>
                      ))} */}
                    </Paper>
                  </Grid>
                );
              })}
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
