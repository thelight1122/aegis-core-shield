# AEGIS Core Shield - Installation Guide

This guide covers the prerequisites and steps needed to install, build, and run AEGIS Core Shield and its accompanying tools.

## Prerequisites

- **Node.js**: Requires version 20.x or higher (recommended).
- **npm**: Comes bundled with Node.js. Used for managing project dependencies.
- **TypeScript**: The project is written in TypeScript and requires the `tsc` compiler, though it runs via `ts-node` in development.

## Installation Steps

1. **Clone the Repository**
   Assuming you have Git installed, clone the repository to your local machine:

   ```bash
   git clone https://github.com/thelight1122/aegis-core-shield.git
   cd aegis-core-shield
   ```

2. **Install Dependencies**
   Run the following command to download and install all required `npm` packages, including Electron, React, Jest, and TypeScript:

   ```bash
   npm install
   ```

## Build and Run Scripts

The `package.json` provides several scripts for testing, building, and running the graphical or command-line interfaces.

### Command Line Interface (CLI)

You can run a prompt through the Discernment Gate directly from your terminal using `ts-node`:

```bash
# Test a prompt through the gate
npm run gate "Your prompt here"

# Example: Clean prompt (admitted)
npm run gate "The weather is nice today"

# Example: Prompt containing force-pattern indicators (returned)
npm run gate "You must do this now"
```

### Graphical User Interface (GUI)

The project includes an Electron-based dashboard built with React.

```bash
# Launch the Electron GUI Dashboard
npm run gui
```

*(Ensure you have run `npm install` fully before launching the GUI, as it depends on Electron and React DOM libraries).*

### Steward Server

To run the local steward server for the OpenClaw sidecar adapter:

```bash
npm run steward
```

This spins up a local Express-style server on port 3636 that can ingest OpenClaw events and facilitate DataQuad logging.

### Development and Build

- **Type Checking**: Validate TypeScript syntax and types without compiling.

  ```bash
  npm run typecheck
  ```

- **Build**: Compiles the source files from `src/` into standard JavaScript modules in the `dist/` directory.

  ```bash
  npm run build
  ```

- **Clean**: Removes the compiled `dist/` output directory.

  ```bash
  npm run clean
  ```

### Testing

The project uses Jest for testing the tokenization, scoring modules, and IDS pipeline.

```bash
# Run all unit and integration tests
npm test

# Run tests in continuous watch mode (ideal during development)
npm run test:watch
```
