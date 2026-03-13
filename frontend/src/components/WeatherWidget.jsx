import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind, Droplets, MapPin, ChevronDown, Search } from 'lucide-react';

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWeather = async (lat, lon, cityName = "") => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`);
      const data = await res.json();
      setWeatherData(data);

      if (cityName) {
        setLocationName(cityName);
      } else {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geoData = await geoRes.json();
          setLocationName(geoData.address?.city || geoData.address?.town || geoData.address?.state || "Local");
        } catch(e) {
           setLocationName("Local");
        }
      }
    } catch (err) {
      console.error("Failed to fetch weather", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => setLoading(false) // On error/block, finish loading so user can search manually
      );
    } else {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const { latitude, longitude, name, admin1 } = data.results[0];
        const displayName = `${name}${admin1 ? `, ${admin1}` : ''}`;
        await fetchWeather(latitude, longitude, displayName);
        setSearchQuery("");
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (err) {
      console.error("Search failed", err);
      alert("Search failed. Please try again later.");
    } finally {
      setIsSearching(false);
    }
  };

  const getWeatherIcon = (code, size = 18) => {
    // WMO Weather interpretation codes
    if (code <= 3) return <Sun size={size} color="#eab308" />;
    if (code <= 48) return <Cloud size={size} color="#94a3b8" />;
    if (code <= 67) return <CloudRain size={size} color="#3b82f6" />;
    if (code <= 77) return <CloudSnow size={size} color="#0ea5e9" />;
    if (code <= 99) return <CloudLightning size={size} color="#8b5cf6" />;
    return <Cloud size={size} color="#94a3b8" />;
  };

  const getWeatherDesc = (code) => {
    if (code === 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 99) return "Thunderstorm";
    return "Cloudy";
  };

  const getDayName = (dateString, index) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  const renderPill = () => {
    if (loading && !weatherData) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          padding: '0.4rem 0.8rem', 
          background: 'var(--surface-color)', 
          borderRadius: '9999px',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--text-color)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <Sun size={18} color="#eab308" className="animate-spin" />
          <span>Loading...</span>
        </div>
      );
    }

    if (!weatherData || !weatherData.current) {
      return (
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.4rem 0.8rem', 
            background: showDropdown ? 'var(--card-bg-hover)' : 'var(--card-bg)', 
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-main)',
            boxShadow: showDropdown ? 'var(--shadow-md)' : 'none',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          <MapPin size={16} color="var(--primary)" />
          <span>Set Location</span>
          <ChevronDown size={14} style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: '0.1rem', color: 'var(--text-muted)' }} />
        </button>
      );
    }

    const current = weatherData.current;
    return (
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          padding: '0.4rem 0.6rem 0.4rem 0.8rem', 
          background: showDropdown ? 'var(--card-bg-hover)' : 'var(--card-bg)', 
          borderRadius: '9999px',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--text-main)',
          boxShadow: showDropdown ? 'var(--shadow-md)' : 'none',
          cursor: 'pointer',
          transition: 'var(--transition-fast)'
        }} 
        title={locationName}
      >
        {getWeatherIcon(current.weather_code)}
        <span>{Math.round(current.temperature_2m)}°C</span>
        <ChevronDown size={14} style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: '0.1rem', color: 'var(--text-muted)' }} />
      </button>
    );
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {renderPill()}

      {showDropdown && (
        <div className="weather-dropdown" style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          right: 0,
          width: '300px',
          background: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '1rem',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: (isSearching || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isSearching || !searchQuery.trim()) ? 0.7 : 1
              }}
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </form>

          {!weatherData || !weatherData.current ? (
             <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <MapPin size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                <div>Please search for a location<br/>to view weather.</div>
             </div>
          ) : (
            <>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <MapPin size={14} /> {locationName}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
                     {Math.round(weatherData.current.temperature_2m)}°
                  </div>
                  <div style={{ color: 'var(--text-main)', opacity: 0.8, fontSize: '0.9rem', marginTop: '0.4rem', fontWeight: 500 }}>
                     Feels like {Math.round(weatherData.current.apparent_temperature)}° • {getWeatherDesc(weatherData.current.weather_code)}
                  </div>
                </div>
                <div style={{ 
                   padding: '1rem', 
                   background: 'rgba(255,255,255,0.05)', 
                   borderRadius: '50%',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   border: '1px solid var(--border-color)'
                }}>
                   {getWeatherIcon(weatherData.current.weather_code, 40)}
                </div>
              </div>

              {/* Details Row */}
              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.04)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Droplets size={16} color="var(--accent-cyan)" />
                  <div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Humidity</div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{weatherData.current.relative_humidity_2m}%</div>
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wind size={16} color="var(--accent-emerald)" />
                  <div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Wind</div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{Math.round(weatherData.current.wind_speed_10m)} km/h</div>
                  </div>
                </div>
              </div>

              {/* Forecast List */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>5-Day Forecast</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {weatherData.daily && weatherData.daily.time.slice(0, 5).map((time, idx) => (
                    <div key={time} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: idx < 4 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ width: '80px', fontSize: '0.9rem', fontWeight: 500, color: idx === 0 ? 'var(--primary)' : 'var(--text-main)' }}>
                         {getDayName(time, idx)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                         {getWeatherIcon(weatherData.daily.weather_code[idx], 16)}
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getWeatherDesc(weatherData.daily.weather_code[idx])}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '90px', justifyContent: 'flex-end', fontSize: '0.9rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-main)' }}>{Math.round(weatherData.daily.temperature_2m_max[idx])}°</span>
                        <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{Math.round(weatherData.daily.temperature_2m_min[idx])}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
