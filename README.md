# Green Data Center Selector

An application to identify the best data centre to deploy workloads based on the environmental impact of electricity in different parts of the country.

## Overview

This tool helps organizations make environmentally conscious decisions when selecting data centers for their workloads. By analyzing real-time carbon intensity data from the UK's electricity grid, it provides visual insights into the environmental impact of running workloads in different regions.

## Features

- ✅ Real-time carbon intensity data for UK regions via Carbon Intensity API
- ✅ Interactive UK heatmap visualization
- ✅ Workload configuration (CPU cores and memory)
- ✅ CO₂ emissions calculation for each region
- ✅ Sortable data table with regional comparisons
- ✅ Generation mix breakdown by region (fuel type percentages)
- ✅ Responsive Carbon Design System UI
- ✅ WCAG 2.2 accessible interface

## Technology Stack

- **Frontend**: React 18 with Carbon Design System v11
- **Build Tool**: Vite
- **Styling**: SCSS with Carbon tokens
- **API**: Carbon Intensity API (UK)
- **Deployment**: OpenShift Container Platform ready

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andrewlaidlaw/green-datacenter-selector.git
cd green-datacenter-selector
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:5173`.

## Available Scripts

- `npm run dev` - Runs the app in development mode with hot reload
- `npm run build` - Builds the app for production to the `dist` folder
- `npm run preview` - Preview the production build locally

## Project Structure

```
green-datacenter-selector/
├── openshift/              # OpenShift deployment configurations
│   ├── buildconfig.yaml
│   ├── deployment.yaml
│   ├── imagestream.yaml
│   ├── route.yaml
│   └── service.yaml
├── public/
├── src/
│   ├── App.jsx            # Main application component
│   ├── UKHeatmap.jsx      # Interactive UK map visualization
│   ├── main.jsx           # Application entry point
│   └── styles.scss        # Carbon Design System styles
├── Dockerfile             # Container image definition
├── nginx.conf             # Nginx configuration for production
├── vite.config.js         # Vite build configuration
├── DEPLOYMENT.md          # OpenShift deployment guide
└── README.md
```

## Deployment

### OpenShift Container Platform

This application is ready to deploy on OpenShift. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

Quick deploy:
```bash
# Login to OpenShift
oc login

# Create project
oc new-project green-datacenter-selector

# Deploy using BuildConfig
oc apply -f openshift/imagestream.yaml
oc apply -f openshift/buildconfig.yaml
oc start-build green-datacenter-selector

# Deploy application
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml

# Get application URL
oc get route green-datacenter-selector
```

### Docker

Build and run locally with Docker:
```bash
# Build image
docker build -t green-datacenter-selector .

# Run container
docker run -p 8080:8080 green-datacenter-selector
```

## Usage

1. **Configure Workload**: Enter the number of CPU cores and memory (GB) required for your workload
2. **Calculate**: Click the "Calculate" button to fetch real-time carbon intensity data
3. **View Results**: 
   - Interactive heatmap shows CO₂ intensity by region (green = low, red = high)
   - Sortable table displays exact CO₂ emissions per region
   - Click on region names to view generation mix (fuel type breakdown)
4. **Make Decision**: Choose the region with the lowest CO₂ emissions for your deployment

## API Integration

This application uses the [Carbon Intensity API](https://carbonintensity.org.uk/) to fetch:
- Real-time regional carbon intensity data
- Generation mix by fuel type for each region

No API key required - the service is free and open.

## Accessibility

Built with WCAG 2.2 compliance:
- Keyboard navigation support
- Screen reader compatible
- Proper ARIA labels and roles
- High contrast color schemes
- Focus indicators
- Semantic HTML structure

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Roadmap

- [x] Integrate with Carbon Intensity API
- [x] Add UK regional visualization
- [x] Implement CO₂ calculation algorithms
- [x] Create interactive heatmap
- [x] Add generation mix details
- [x] OpenShift deployment support
- [ ] Support for additional countries/regions
- [ ] Historical data trends
- [ ] Export reports functionality
- [ ] Cost comparison alongside carbon data
- [ ] Integration with cloud provider APIs

## Contact

For questions or suggestions, please open an issue on GitHub.

## Acknowledgments

- Carbon intensity data provided by [National Grid ESO](https://carbonintensity.org.uk/)
- UI components from [IBM Carbon Design System](https://carbondesignsystem.com/)
- UK map visualization inspired by regional electricity data