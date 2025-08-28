# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Miaoli Social Welfare Materials Management Platform** (苗栗社福促進協會物資管理平台) - a web-based inventory management system for charitable organizations to track donations and distributions of welfare materials. The system is built as a modern single-page application using modular JavaScript architecture with Tailwind CSS for styling.

## Architecture & Structure

### Project Structure
```
project-root/
├── index.html                 # Main application entry point
├── assets/                    # All static assets
│   ├── css/                  # Stylesheets
│   │   ├── main.css         # Main CSS file
│   │   ├── components/      # Component-specific styles
│   │   └── utils/          # Utility CSS classes
│   ├── js/                  # JavaScript modules
│   │   ├── main.js         # Application entry point
│   │   ├── services/       # Business logic layer
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── components/     # UI components
│   ├── images/             # Image assets
│   ├── fonts/              # Font files
│   └── icons/              # Icon assets
├── public/                 # Public static files
├── components/             # Shared components
└── docs/                  # Documentation
```

### Core Architecture
- **Frontend-Only Application**: Single-page web app with no backend - uses localStorage for data persistence
- **Modular Design**: ES6+ modules with clear separation of concerns
- **Service Layer**: Business logic separated from UI concerns
- **Event-Driven**: Unified event management system replacing inline handlers

### Key Features
- **Inventory Management**: Track charitable materials with categories, quantities, and safety stock levels
- **Donation Tracking**: Record incoming donations with donor information
- **Distribution Records**: Log material distributions to organizations and individuals
- **Receipt Generation**: Print donation receipts for donors
- **Role-Based Access**: Three user roles (volunteer, staff, admin) with different permissions
- **Barcode Support**: ZXing library integration for barcode scanning

### Data Architecture
- **Local Storage**: All data persisted in browser's localStorage as JSON
- **Main Data Structure**: `charityItems` array containing inventory items with operations history
- **Predefined Categories**: 常用類 (Common Items) with extensive list of welfare materials

### User Interface
- **Responsive Design**: Mobile-first with card layout for phones, table layout for desktop
- **Tab-Based Navigation**: Three main views (Inventory, Donations, Distribution Records)
- **Modal System**: Multiple overlays for adding/editing items, batch operations, and receipt generation

## Development Commands

### Running the Application
- **Start Development Server**: `npm run dev` or `python -m http.server 8000`
- **Production Build**: No build process required (static files)
- **Code Validation**: `npm run validate` to check ES6 module syntax

### Available Scripts (package.json)
```bash
npm run start     # Start development server
npm run dev       # Development server (alias)
npm run serve     # Static file server (alias)
npm run validate  # Validate JavaScript modules
```

### External Dependencies (CDN)
- Tailwind CSS: `https://cdn.tailwindcss.com`
- ZXing Library: `https://unpkg.com/@zxing/library@latest`

### Module System
- Uses ES6+ modules with `type="module"`
- All imports use explicit `.js` extensions
- Services layer handles business logic
- Utils layer provides common functionality

## Code Conventions

### JavaScript
- Uses ES6+ features with vanilla JavaScript (no frameworks)
- Global variables declared at top of main.js
- Functions organized by feature area (inventory, donations, UI management)
- Event listeners attached in DOMContentLoaded handler

### HTML Structure
- Semantic HTML with accessibility considerations
- Template elements for dynamic content generation
- Comprehensive modal system for all major operations
- Mobile-responsive navigation with collapsible elements

### Styling
- Tailwind utility classes for all styling
- Chinese typography support with custom font stack
- Consistent color scheme (green for donations, blue for distributions, purple for adjustments)
- Responsive breakpoints optimized for mobile usage

### Data Management
- All operations create audit trails in item.operations array
- Role-based permission checking before sensitive operations
- Automatic safety stock warnings and low inventory alerts
- Date formatting standardized to Taiwan locale (zh-TW)

## Key Integration Points

### Barcode Scanning
- ZXing library for camera-based barcode recognition
- Integrated into search functionality for quick item lookup

### Printing System
- Browser-based printing for donation receipts
- Template-driven receipt generation with organization branding

### Permission System
- Three-tier role system affects UI visibility and function access
- `checkPermission()` function validates user actions
- Role adjustments modify available interface elements