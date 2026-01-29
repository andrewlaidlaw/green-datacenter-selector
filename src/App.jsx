import React, { useState } from 'react';
import {
  Header,
  HeaderName,
  Content,
  Grid,
  Column,
  NumberInput,
  Button,
  InlineLoading,
  InlineNotification,
  DataTable,
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Modal
} from '@carbon/react';
import UKHeatmap from './UKHeatmap';

// Map Carbon Intensity API region IDs to display names
// Based on official API documentation: https://carbon-intensity.github.io/api-definitions/#region-list
// Excludes aggregate regions (15: England, 16: Scotland, 17: Wales) to show specific regions only
const regionMapping = {
  1: 'North Scotland',
  2: 'South Scotland',
  3: 'North West England',
  4: 'North East England',
  5: 'South Yorkshire',
  6: 'North Wales, Merseyside and Cheshire',
  7: 'South Wales',
  8: 'West Midlands',
  9: 'East Midlands',
  10: 'East England',
  11: 'South West England',
  12: 'South England',
  13: 'London',
  14: 'South East England'
};

// Reverse mapping: region name to ID
const regionNameToId = Object.entries(regionMapping).reduce((acc, [id, name]) => {
  acc[name] = id;
  return acc;
}, {});

function App() {
  const [cores, setCores] = useState(4);
  const [memoryGb, setMemoryGb] = useState(16);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [generationMix, setGenerationMix] = useState(null);
  const [mixLoading, setMixLoading] = useState(false);

  const fetchGenerationMix = async (regionName) => {
    setMixLoading(true);
    try {
      const regionId = regionNameToId[regionName];
      const response = await fetch(`https://api.carbonintensity.org.uk/regional/regionid/${regionId}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].data && data.data[0].data[0]) {
        const mixData = data.data[0].data[0].generationmix;
        setGenerationMix(mixData);
        setSelectedRegion(regionName);
      }
    } catch (err) {
      console.error('Error fetching generation mix:', err);
      setError('Failed to fetch generation mix data.');
    } finally {
      setMixLoading(false);
    }
  };

  const handleRegionClick = (regionName) => {
    fetchGenerationMix(regionName);
  };

  const closeModal = () => {
    setSelectedRegion(null);
    setGenerationMix(null);
  };

  const fetchCarbonIntensity = async () => {
    try {
      // Fetch regional carbon intensity data from Carbon Intensity API
      const response = await fetch('https://api.carbonintensity.org.uk/regional');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract intensity data for each region
      const regionIntensities = {};
      data.data[0].regions.forEach(region => {
        const regionId = region.regionid;
        const regionName = regionMapping[regionId];
        if (regionName) {
          // Convert gCO2/kWh to kgCO2/kWh
          regionIntensities[regionName] = region.intensity.forecast / 1000;
        }
      });
      
      return regionIntensities;
    } catch (err) {
      console.error('Error fetching carbon intensity data:', err);
      throw err;
    }
  };

  const calculateCO2 = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch real-time carbon intensity data
      const regionIntensities = await fetchCarbonIntensity();
      
      // Calculate power consumption based on cores and memory
      // Typical server: ~10W per core, ~2W per GB of RAM
      const powerWatts = (cores * 10) + (memoryGb * 2);
      const powerKwh = powerWatts / 1000;
      
      // Calculate CO2 for each region (assuming 24/7 operation for 1 year)
      const hoursPerYear = 8760;
      const annualKwh = powerKwh * hoursPerYear;
      
      const regionResults = Object.entries(regionIntensities).map(([name, co2PerKwh]) => ({
        name,
        co2Kg: (annualKwh * co2PerKwh).toFixed(2)
      }));
      
      setResults(regionResults);
    } catch (err) {
      setError('Failed to fetch carbon intensity data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header aria-label="Green Datacenter Selector">
        <HeaderName href="#" prefix="IBM">
          Green Datacenter Selector
        </HeaderName>
      </Header>
      
      <Content>
        <div className="page-content">
          <Grid>
            <Column sm={4} md={8} lg={12}>
              <h1>Datacenter Carbon Calculator</h1>
              
              <section className="form-section" aria-labelledby="workload-heading">
                <h2 id="workload-heading">Workload Configuration</h2>
                
                <div className="input-row">
                  <NumberInput
                    id="cores-input"
                    label="Number of Cores"
                    min={1}
                    max={128}
                    value={cores}
                    onChange={(e, { value }) => setCores(value)}
                    invalidText="Please enter a valid number of cores"
                    helperText="Enter the number of CPU cores required"
                  />
                  
                  <NumberInput
                    id="memory-input"
                    label="Memory (GB)"
                    min={1}
                    max={1024}
                    value={memoryGb}
                    onChange={(e, { value }) => setMemoryGb(value)}
                    invalidText="Please enter a valid amount of memory"
                    helperText="Enter the amount of memory in gigabytes"
                  />
                </div>
                
                <div className="button-section">
                  <Button
                    kind="primary"
                    onClick={calculateCO2}
                    disabled={loading}
                  >
                    Calculate
                  </Button>
                  {loading && (
                    <InlineLoading
                      description="Fetching carbon intensity data..."
                      status="active"
                    />
                  )}
                </div>
                
                {error && (
                  <InlineNotification
                    kind="error"
                    title="Error"
                    subtitle={error}
                    lowContrast
                    hideCloseButton={false}
                    onCloseButtonClick={() => setError(null)}
                  />
                )}
              </section>
              
              {results && !loading && (
                <section className="map-section" aria-labelledby="results-heading">
                  <h2 id="results-heading">CO₂ Emissions by UK Region</h2>
                  <p>Annual CO₂ equivalent (kg) for {cores} cores and {memoryGb} GB memory (based on current carbon intensity):</p>
                  
                  <div className="results-container">
                    <div className="heatmap-wrapper">
                      <UKHeatmap results={results} onRegionClick={handleRegionClick} />
                    </div>
                    
                    <div className="table-wrapper">
                      <DataTable
                        rows={[...results]
                          .sort((a, b) => parseFloat(a.co2Kg) - parseFloat(b.co2Kg))
                          .map((region, index) => ({
                            id: String(index),
                            name: region.name,
                            co2Kg: parseFloat(region.co2Kg)
                          }))}
                        headers={[
                          { key: 'name', header: 'Region' },
                          { key: 'co2Kg', header: 'CO₂ (kg/year)' }
                        ]}
                        isSortable
                      >
                        {({ rows, headers, getHeaderProps, getTableProps, getRowProps }) => (
                          <Table {...getTableProps()} aria-label="Regional CO2 emissions table">
                            <TableHead>
                              <TableRow>
                                {headers.map((header) => {
                                  const { key, ...headerProps } = getHeaderProps({ header });
                                  return (
                                    <TableHeader
                                      key={header.key}
                                      {...headerProps}
                                      isSortable
                                    >
                                      {header.header}
                                    </TableHeader>
                                  );
                                })}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows.map((row) => {
                                const { key, ...rowProps } = getRowProps({ row });
                                return (
                                  <TableRow key={row.id} {...rowProps}>
                                    {row.cells.map((cell) => (
                                      <TableCell key={cell.id}>
                                      {cell.info.header === 'name' ? (
                                        <button
                                          className="region-link"
                                          onClick={() => handleRegionClick(cell.value)}
                                          aria-label={`View generation mix for ${cell.value}`}
                                        >
                                          {cell.value}
                                        </button>
                                      ) : (
                                        cell.value.toFixed(2)
                                      )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </DataTable>
                    </div>
                  </div>
                </section>
              )}
            </Column>
          </Grid>
        </div>
      </Content>
      
      {/* Generation Mix Modal */}
      <Modal
        open={selectedRegion !== null}
        onRequestClose={closeModal}
        modalHeading={`Generation Mix - ${selectedRegion}`}
        modalLabel="Energy Sources"
        primaryButtonText="Close"
        onRequestSubmit={closeModal}
        size="sm"
      >
        {mixLoading ? (
          <InlineLoading description="Loading generation mix..." />
        ) : generationMix ? (
          <div className="generation-mix-table">
            <Table size="sm" aria-label="Generation mix breakdown">
              <TableHead>
                <TableRow>
                  <TableHeader>Fuel Type</TableHeader>
                  <TableHeader>Percentage (%)</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {generationMix.map((fuel) => (
                  <TableRow key={fuel.fuel}>
                    <TableCell>{fuel.fuel}</TableCell>
                    <TableCell>{fuel.perc.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No generation mix data available.</p>
        )}
      </Modal>
    </>
  );
}

export default App;

// Made with Bob
