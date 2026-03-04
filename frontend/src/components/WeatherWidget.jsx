import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind, Droplets, MapPin, ChevronDown } from 'lucide-react';

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
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

  useEffect(() => {
    const fetchWeather = async (lat, lon, cityName = "") => {
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
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(28.6139, 77.2090, "New Delhi") // Default to New Delhi on block
      );
    } else {
      fetchWeather(28.6139, 77.2090, "New Delhi");
    }
  }, []);

  if (!weatherData || !weatherData.current) return (
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

  const current = weatherData.current;
  const daily = weatherData.daily;

  const getDayName = (dateString, index) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Pill */}
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

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          right: 0,
          width: '320px',
          background: 'var(--bg-color)', /* Made fully opaque */
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '1.25rem',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                <MapPin size={14} /> {locationName}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
                 {Math.round(current.temperature_2m)}°
              </div>
              <div style={{ color: 'var(--text-main)', opacity: 0.8, fontSize: '0.9rem', marginTop: '0.4rem', fontWeight: 500 }}>
                 Feels like {Math.round(current.apparent_temperature)}° • {getWeatherDesc(current.weather_code)}
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
               {getWeatherIcon(current.weather_code, 40)}
            </div>
          </div>

          {/* Details Row */}
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.04)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Droplets size={16} color="var(--accent-cyan)" />
              <div>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Humidity</div>
                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{current.relative_humidity_2m}%</div>
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wind size={16} color="var(--accent-emerald)" />
              <div>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Wind</div>
                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{Math.round(current.wind_speed_10m)} km/h</div>
              </div>
            </div>
          </div>

          {/* Forecast List */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>5-Day Forecast</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {daily && daily.time.slice(0, 5).map((time, idx) => (
                <div key={time} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: idx < 4 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: '80px', fontSize: '0.9rem', fontWeight: 500, color: idx === 0 ? 'var(--primary)' : 'var(--text-main)' }}>
                     {getDayName(time, idx)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                     {getWeatherIcon(daily.weather_code[idx], 16)}
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getWeatherDesc(daily.weather_code[idx])}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '90px', justifyContent: 'flex-end', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-main)' }}>{Math.round(daily.temperature_2m_max[idx])}°</span>
                    <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{Math.round(daily.temperature_2m_min[idx])}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
