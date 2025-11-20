        const DISCORD_USER_ID = '1078313475727691787';

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');
                
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(targetPage).classList.add('active');
            });
        });

        function updateDateTime() {
            const now = new Date();
            const dateOptions = { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                timeZone: 'America/New_York'
            };
            const timeOptions = {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'America/New_York'
            };
            
            const dateStr = now.toLocaleString('en-US', dateOptions);
            const timeStr = now.toLocaleString('en-US', timeOptions);
            
            document.getElementById('datetime').textContent = `${dateStr} · ${timeStr} EST`;
        }
        
        async function updateWeather() {
            try {
                const lat = 38.9784;
                const lon = -76.4922;
                
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`
                );
                const data = await response.json();
                
                const temp = Math.round(data.current_weather.temperature);
                const weatherCode = data.current_weather.weathercode;
                const condition = getWeatherCondition(weatherCode);
                
                document.getElementById('weather').textContent = 
                    `It's ${temp}°F with ${condition} in Maryland.`;
            } catch (error) {
                document.getElementById('weather').textContent = 
                    'Weather data unavailable';
                console.error('Weather fetch error:', error);
            }
        }

        function getWeatherCondition(code) {
            if (code === 0) return 'clear skies';
            if (code <= 3) return 'partly cloudy';
            if (code <= 49) return 'fog';
            if (code <= 69) return 'rain';
            if (code <= 79) return 'snow';
            if (code <= 99) return 'thunderstorms';
            return 'scattered clouds';
        }

        // Fetch Discord status
        async function updateDiscordStatus() {
            const userId = DISCORD_USER_ID;
            
            if (!userId || userId === 'YOUR_DISCORD_USER_ID_HERE') {
                document.getElementById('discordCard').innerHTML = `
                    <div class="error">
                        Please set your Discord User ID in the script.<br>
                        Join <a href="https://discord.gg/lanyard" target="_blank" style="color: #818cf8;">discord.gg/lanyard</a> first.
                    </div>
                `;
                document.getElementById('spotifyCard').innerHTML = `
                    <div class="error">Discord data required</div>
                `;
                return;
            }

            try {
                const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
                const data = await response.json();

                if (data.success) {
                    updateDiscordCard(data.data);
                    updateActivityStatus(data.data);
                    updateSpotifyCard(data.data);
                } else {
                    throw new Error('User not found');
                }
            } catch (error) {
                document.getElementById('discordCard').innerHTML = `
                    <div class="error">Failed to load Discord profile.</div>
                `;
                console.error('Discord fetch error:', error);
            }
        }

        function updateDiscordCard(data) {
            const statusClass = `status-${data.discord_status}`;
            const avatar = data.discord_user.avatar 
                ? `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=128`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';

            const statusText = {
                'online': 'Online',
                'idle': 'Idle',
                'dnd': 'Do Not Disturb',
                'offline': 'Offline'
            }[data.discord_status] || 'Unknown';

            let customStatus = '';
            const customActivity = data.activities.find(a => a.type === 4);
            if (customActivity && customActivity.state) {
                customStatus = customActivity.state;
            }

            document.getElementById('discordCard').innerHTML = `
                <div class="discord-avatar-container">
                    <img src="${avatar}" alt="Discord Avatar" class="discord-avatar">
                    <div class="status-dot ${statusClass}"></div>
                </div>
                <div class="discord-info">
                    <div class="discord-username">${data.discord_user.username}</div>
                    <div class="discord-status">${customStatus || statusText}</div>
                </div>
            `;
        }

        function updateActivityStatus(data) {
            const activityContainer = document.getElementById('activityStatus');
            const activity = data.activities.find(a => a.type === 0 || a.type === 3);
            
            if (activity) {
                let activityIcon = '';
                let activityName = activity.name || 'Unknown Activity';
                let activityDetails = activity.details || '';
                let activityState = activity.state || '';
                let elapsed = '';

                if (activity.assets && activity.assets.large_image) {
                    const imageId = activity.assets.large_image;
                    if (imageId.startsWith('mp:')) {
                        activityIcon = `<img src="https://media.discordapp.net/${imageId.replace('mp:', '')}" alt="${activityName}">`;
                    } else {
                        activityIcon = `<img src="https://cdn.discordapp.com/app-assets/${activity.application_id}/${imageId}.png" alt="${activityName}">`;
                    }
                }

                if (!activityIcon) {
                    activityIcon = '<span style="font-size: 24px;">🎮</span>';
                }

                if (activity.timestamps && activity.timestamps.start) {
                    const start = activity.timestamps.start;
                    const now = Date.now();
                    const diff = now - start;
                    const minutes = Math.floor(diff / 60000);
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    
                    if (hours > 0) {
                        elapsed = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} elapsed`;
                    } else {
                        elapsed = `${mins.toString().padStart(2, '0')}:${Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')} elapsed`;
                    }
                }

                let description = '';
                if (activityDetails && activityState) {
                    description = `${activityDetails}<br>${activityState}`;
                } else if (activityDetails) {
                    description = activityDetails;
                } else if (activityState) {
                    description = activityState;
                }

                activityContainer.style.display = 'flex';
                activityContainer.innerHTML = `
                    <div class="activity-icon">${activityIcon}</div>
                    <div class="activity-details">
                        <div class="activity-name">${activityName}</div>
                        ${description ? `<div class="activity-description">${description}</div>` : ''}
                        ${elapsed ? `<div class="activity-time">${elapsed}</div>` : ''}
                    </div>
                `;
            } else {
                activityContainer.style.display = 'none';
            }
        }

        function updateSpotifyCard(data) {
            if (data.listening_to_spotify && data.spotify) {
                const spotify = data.spotify;
                document.getElementById('spotifyCard').innerHTML = `
                    <img src="${spotify.album_art_url}" alt="Album Art" class="album-art">
                    <div class="spotify-info">
                        <div class="spotify-label">
                            <span class="activity-indicator"></span>
                            <div class="music-label">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M17.721 1.599a.75.75 0 01.279.584v11.29a2.25 2.25 0 01-1.774 2.198l-2.041.442a2.216 2.216 0 01-.938-4.333l2.662-.576a.75.75 0 00.591-.734V6.112l-8 1.73v7.684a2.25 2.25 0 01-1.774 2.2l-2.042.44a2.216 2.216 0 11-.935-4.33l2.659-.574A.75.75 0 007 12.53V4.237a.75.75 0 01.591-.733l9.5-2.054a.75.75 0 01.63.149z" clip-rule="evenodd"></path></svg> Playing on Spotify
                            </div>                        
                            </div>
                        
                        <div class="spotify-title">${spotify.song}</div>
                        <div class="spotify-artist">${spotify.artist}</div>
                    </div>
                `;
            } else {
                const spotifyActivity = data.activities.find(a => a.name === 'Spotify');
                if (spotifyActivity) {
                    document.getElementById('spotifyCard').innerHTML = `
                        <div class="spotify-info">
                            <div class="spotify-label"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M17.721 1.599a.75.75 0 01.279.584v11.29a2.25 2.25 0 01-1.774 2.198l-2.041.442a2.216 2.216 0 01-.938-4.333l2.662-.576a.75.75 0 00.591-.734V6.112l-8 1.73v7.684a2.25 2.25 0 01-1.774 2.2l-2.042.44a2.216 2.216 0 11-.935-4.33l2.659-.574A.75.75 0 007 12.53V4.237a.75.75 0 01.591-.733l9.5-2.054a.75.75 0 01.63.149z" clip-rule="evenodd"></path></svg> Last played on Spotify</div>
                            <div class="spotify-title">${spotifyActivity.details || 'Unknown Song'}</div>
                            <div class="spotify-artist">${spotifyActivity.state || 'Unknown Artist'}</div>
                        </div>
                    `;
                } else {
                    document.getElementById('spotifyCard').innerHTML = `
                        <div class="spotify-info">
                            <div class="spotify-label"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M17.721 1.599a.75.75 0 01.279.584v11.29a2.25 2.25 0 01-1.774 2.198l-2.041.442a2.216 2.216 0 01-.938-4.333l2.662-.576a.75.75 0 00.591-.734V6.112l-8 1.73v7.684a2.25 2.25 0 01-1.774 2.2l-2.042.44a2.216 2.216 0 11-.935-4.33l2.659-.574A.75.75 0 007 12.53V4.237a.75.75 0 01.591-.733l9.5-2.054a.75.75 0 01.63.149z" clip-rule="evenodd"></path></svg> Spotify</div>
                            <div class="spotify-status">Not listening to anything</div>
                        </div>
                    `;
                }
            }
        }

        // Initialize and update
        updateDateTime();
        updateWeather();
        updateDiscordStatus();
        
        setInterval(updateDateTime, 1000);

        // Update weather every 10 minutes
        setInterval(updateWeather, 600000);

        setInterval(updateDiscordStatus, 1);
