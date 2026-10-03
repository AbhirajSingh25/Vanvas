async function verifyAll() {
  const destinations = ['manali', 'goa', 'leh', 'jaipur', 'rishikesh', 'kasol'];
  console.log('=== VANVAS PRODUCTION WEATHER VERIFICATION ===\n');

  // 1. Health check
  const healthRes = await fetch('https://vanvas-api.onrender.com/health');
  const health = await healthRes.json();
  console.log('Backend Health:', health);

  // 2. Weather endpoints
  for (const slug of destinations) {
    console.log(`\n--- Destination: ${slug.toUpperCase()} ---`);
    const directUrl = `https://vanvas-api.onrender.com/api/v1/destinations/${slug}/weather`;
    const vercelUrl = `https://vanvasai.vercel.app/api/v1/destinations/${slug}/weather`;

    try {
      const res = await fetch(directUrl);
      const data = await res.json();
      console.log(`Direct API [${res.status}]:`, {
        temperature: data.temperature,
        apparentTemperature: data.apparentTemperature,
        weatherCode: data.weatherCode,
        condition: data.condition,
        isDay: data.isDay,
        windSpeed: data.windSpeed,
        humidity: data.humidity,
        is_available: data.is_available,
        trust_source: data.trust_source,
        data_state: data.data_state,
        dailyCount: data.daily?.length
      });
    } catch(e) {
      console.error(`Direct API error for ${slug}:`, e.message);
    }

    try {
      const vRes = await fetch(vercelUrl);
      const vData = await vRes.json();
      console.log(`Vercel Proxy [${vRes.status}]:`, {
        temperature: vData.temperature,
        condition: vData.condition,
        is_available: vData.is_available,
        dailyCount: vData.daily?.length
      });
    } catch(e) {
      console.error(`Vercel Proxy error for ${slug}:`, e.message);
    }
  }
}

verifyAll();
