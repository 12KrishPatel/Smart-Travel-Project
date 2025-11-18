# Smart Travel Recommender

A full-stack web application that helps users plan eco-friendly travel routes by visualizing routes on an interactive map and calculating CO₂ emissions savings when choosing greener transportation modes over driving.

---

## 🌟 Features

### Interactive Route Planning
- **Google Places Autocomplete**: Smart address search with autocomplete suggestions for origin and destination
- **Multi-Mode Travel Options**: Choose between driving, walking, bicycling, or public transit
- **Real-Time Route Visualization**: Interactive map powered by React-Leaflet and OpenStreetMap tiles
- **Route Details**: Displays distance, duration, and visual route path on the map
- **Auto-Location**: Automatically detects and centers on your current location (with permission)

### CO₂ Savings Calculator
- **Emission Comparison**: Compare CO₂ emissions across different transportation modes
- **Savings Visualization**: See how much carbon you save (or waste) by choosing different modes
- **Real-Time Calculations**: Instant calculations based on route distance and selected mode
- **Emission Rates**: Uses industry-standard CO₂ emission rates (grams per kilometer)

### User Experience
- **Smooth Animations**: Page transitions powered by Framer Motion
- **Responsive Design**: Clean, modern UI that works on various screen sizes
- **Intuitive Navigation**: Easy-to-use navbar for switching between map and savings pages

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Vite** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **React-Leaflet** - Interactive map components
- **Framer Motion** - Smooth animations and transitions
- **Axios** - HTTP client for API requests
- **Polyline** - Decode Google Maps polyline data
- **Google Maps Places API** - Address autocomplete

### Backend
- **FastAPI** - Modern Python web framework
- **Python-Dotenv** - Environment variable management
- **Requests** - HTTP library for Google Maps API calls
- **Pydantic** - Data validation

### APIs & Services
- **Google Maps Directions API** - Route calculation and directions
- **Google Maps Places API** - Address autocomplete
- **OpenStreetMap** - Map tile provider

---

## 📁 Project Structure

```
Smart-Travel-Project/
├── backend/
│   ├── main.py              # FastAPI backend server
│   └── venv/                # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app component with routing
│   │   ├── components/
│   │   │   ├── Navbar.jsx   # Navigation component
│   │   │   └── Navbar.css
│   │   └── pages/
│   │       ├── MapPage.jsx  # Route planning and map visualization
│   │       └── SavingsPage.jsx  # CO₂ savings calculator
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) and npm
- **Python** (v3.8 or higher)
- **Google Maps API Key** with the following APIs enabled:
  - Directions API
  - Places API
  - Maps JavaScript API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smart-Travel-Project
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install fastapi uvicorn python-dotenv requests pydantic
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

1. **Backend** - Create a `.env` file in the `backend/` directory:
   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

2. **Frontend** - Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_API_URL=http://localhost:8000
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn main:app --reload
   ```
   The backend will run on `http://localhost:8000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

3. **Open your browser**
   Navigate to the frontend URL (typically `http://localhost:5173`)

---

## 📡 API Endpoints

### Backend API

- **GET** `/` - Health check endpoint
  - Returns: `{"message": "Smart Travel Recommender is running"}`

- **POST** `/api/calculate-route` - Calculate route between two points
  - Request Body:
    ```json
    {
      "origin": "Madison, WI",
      "destination": "Milwaukee, WI",
      "mode": "driving"  // Options: "driving", "walking", "bicycling", "transit"
    }
    ```
  - Response:
    ```json
    {
      "origin": "Madison, WI, USA",
      "destination": "Milwaukee, WI, USA",
      "mode": "driving",
      "distance": "79.4 mi",
      "duration": "1 hour 15 mins",
      "polyline": "encoded_polyline_string"
    }
    ```

- **GET** `/api/maps-key` - Get Google Maps API URL (for reference)
  - Returns: `{"url": "https://maps.googleapis.com/maps/api/js?key=..."}`

---

## 🎯 How It Works

### Route Planning Flow

1. **User Input**: User enters origin and destination using Google Places autocomplete
2. **Mode Selection**: User selects transportation mode (driving, walking, bicycling, transit)
3. **Route Calculation**: Frontend sends request to FastAPI backend
4. **API Integration**: Backend calls Google Maps Directions API
5. **Route Visualization**: Decoded polyline is displayed on React-Leaflet map
6. **Route Details**: Distance and duration are shown in a summary card

### CO₂ Savings Calculation

1. **Distance Input**: Distance from route calculation (or manual entry)
2. **Mode Selection**: User selects their chosen transportation mode
3. **Emission Calculation**: 
   - Driving: 192 g CO₂/km
   - Transit: 105 g CO₂/km
   - Bicycling: 0 g CO₂/km
   - Walking: 0 g CO₂/km
4. **Comparison**: Calculates CO₂ waste compared to other modes
5. **Results Display**: Shows how much CO₂ is wasted compared to each alternative mode

---

## 🔧 Development

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```
The production build will be in `frontend/dist/`

**Backend:**
The FastAPI backend can be deployed using:
- Uvicorn (production): `uvicorn main:app --host 0.0.0.0 --port 8000`
- Docker
- Cloud platforms (Render, Railway, Heroku, etc.)

### Environment-Specific Configuration

For production, update `VITE_API_URL` in the frontend `.env` to point to your deployed backend URL.

---

## 🎨 Features in Detail

### Map Page
- Interactive map with OpenStreetMap tiles
- Google Places autocomplete for address input
- Real-time route visualization with polyline
- Auto-fit map bounds to show entire route
- Current location marker
- Route summary card with distance, duration, and link to savings page

### Savings Page
- CO₂ emission comparison across all transportation modes
- Manual distance input option
- Transportation mode selector
- Visual comparison of CO₂ waste for each alternative mode

---

## 🔐 Security Notes

- **API Keys**: Never commit API keys to version control
- **CORS**: Currently configured to allow all origins (`*`) - restrict in production
- **Environment Variables**: Always use `.env` files for sensitive data
- **API Key Restrictions**: Configure Google Cloud Console to restrict API key usage by:
  - HTTP referrer (for frontend)
  - IP address (for backend)
  - API restrictions (only enable needed APIs)

---

## 🚧 Future Enhancements

Potential improvements and features:
- User authentication and saved routes
- Route history and favorites
- Multiple route options comparison
- Real-time traffic data integration
- Cost comparison (fuel, transit fares)
- Export route data (GPX, KML)
- Mobile app version
- Offline map support
- Route sharing functionality

---

## 📝 License

This project is open source and available for educational purposes.

---

## 👤 Author

**Krish Patel**  
University of Wisconsin–Madison  
B.S. Computer Science & Data Science  
LinkedIn: [linkedin.com/in/12krishpatel](https://linkedin.com/in/12krishpatel)

---

## 🙏 Acknowledgments

- Google Maps Platform for routing and geocoding APIs
- OpenStreetMap for map tiles
- React and FastAPI communities for excellent documentation

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository or contact the author.
