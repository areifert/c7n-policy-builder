import * as React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Chip, Divider, InputAdornment, TextField,
  Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';


export default function CollapsibleSection(props) {
  const { data, dataSegments, title, onClick, includeCount } = props;

  /* TODO Handle controlled expanding/collapsing */

  const [filter, setFilter] = React.useState('');

  const getFilteredData = React.useCallback(() => {
    return Object.keys(data).filter(d => d.split('.').pop().includes(filter));
  }, [data, filter]);

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography sx={{ width: '33%', flexShrink: 0 }}>{title}</Typography>
        {includeCount &&
            <Typography sx={{ color: 'text.secondary' }}>{Object.keys(data).filter(d => data[d].selected).length} selected</Typography>
        }
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

        {!dataSegments ? (
          getFilteredData().map((value) => (
            <Chip
              key={value}
              label={value}
              color={data[value] && data[value].selected ? 'primary' : 'default'}
              variant={data[value] && data[value].selected ? 'filled' : 'outlined'}
              sx={{margin: '5px'}}
              onClick={onClick}
              disableRipple
            />
          ))
        ) : (
          dataSegments.map((segment, index) => {
            let filteredData = getFilteredData();
            if (segment.filterFunction) {
              filteredData = filteredData.filter(segment.filterFunction);
            }

            if (filteredData.length === 0) {
              return <React.Fragment key={index} />;
            } else {
              return (
                <React.Fragment key={index}>
                  {segment.title &&
                    <Divider>{segment.title}</Divider>
                  }
                  {filteredData.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      color={data[value] && data[value].selected ? 'primary' : 'default'}
                      variant={data[value] && data[value].selected ? 'filled' : 'outlined'}
                      sx={{margin: '5px'}}
                      onClick={onClick}
                      disableRipple
                    />
                  ))}
                </React.Fragment>
              );
            }
          }))}
      </AccordionDetails>
    </Accordion>
  );
}
