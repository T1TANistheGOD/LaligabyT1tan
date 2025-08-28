// Team logo mapping
const images = {
        "Deportivo Alaves": "images/alaves.png",
        "Barcelona": "images/barcelona.png",
        "Real Madrid": "images/madrid.png",
        "Atletico Madrid": "images/atletico.png",
        "Athletic Club": "images/athletic.png",
        "Villarreal": "images/villarreal.png",
        "Real Betis": "images/betis.png",
        "Celta Vigo": "images/celta.png",
        "Rayo Vallecano": "images/rayo.png",
        "Mallorca": "images/mallorca.png",
        "Osasuna": "images/osasuna.png",
        "Valencia": "images/valencia.png",
        "Real Sociedad": "images/real-sociedad.png",
        "Getafe": "images/getafe.png",
        "Espanyol": "images/espanyol.png",
        "Girona": "images/girona.png",
        "Sevilla": "images/sevilla.png",
        "Leganes": "images/leganes.png",
        "Las Palmas": "images/las-palmas.png",
        "Real Valladolid": "images/valladolid.png"
    };

// Function to get team logo
const getTeamLogo = (teamName) => {
    return images[teamName] || 'images/placeholder.png';
};

document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    window.showSection = (sectionId) => {
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.opacity = '0';
        });
        const activeSection = document.getElementById(sectionId);
        activeSection.classList.add('active');
        setTimeout(() => {
            activeSection.style.opacity = '1';
        }, 10);
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`a[href="#${sectionId}"]`).classList.add('active');
    };

    // Function to parse Esd timestamp
    const parseEsdDate = (esd) => {
        const esdStr = String(esd);
        if (esdStr.length !== 14) {
            return new Date();
        }
        const year = esdStr.substring(0, 4);
        const month = esdStr.substring(4, 6) - 1;
        const day = esdStr.substring(6, 8);
        const hour = esdStr.substring(8, 10);
        const minute = esdStr.substring(10, 12);
        const second = esdStr.substring(12, 14);
        return new Date(year, month, day, hour, minute, second);
    };

    // Function to format time as HH:MM
    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Fixtures and Results Sections
    const fetchMatches = async () => {
        const url = 'https://livescore6.p.rapidapi.com/matches/v2/list-by-league?Category=soccer&Ccd=spain&Scd=laliga&Timezone=5.75';
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '644c313eb1msh54941d04889366cp18e9f9jsn5ba62ab2afde',
                'x-rapidapi-host': 'livescore6.p.rapidapi.com'
            }
        };

        const fixturesContainer = document.getElementById('fixtures-matches');
        const resultsContainer = document.getElementById('results-matches');
        const fixturesError = document.getElementById('fixtures-error');
        const resultsError = document.getElementById('results-error');

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            const matches = result.Stages?.[0]?.Events || [];

            // Separate fixtures (not started) and results (finished)
            const fixtures = matches.filter(match => match.Eps !== 'FT' && match.Eps !== 'HT');
            const results = matches.filter(match => match.Eps === 'FT' || match.Eps === 'HT');

            // Sort by date
            fixtures.sort((a, b) => parseEsdDate(a.Esd) - parseEsdDate(b.Esd));
            results.sort((a, b) => parseEsdDate(b.Esd) - parseEsdDate(a.Esd));

            // Fixtures: Group by date
            const fixturesByDate = {};
            fixtures.forEach(match => {
                const date = parseEsdDate(match.Esd);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                if (!fixturesByDate[formattedDate]) {
                    fixturesByDate[formattedDate] = [];
                }
                fixturesByDate[formattedDate].push(match);
            });

            fixturesContainer.innerHTML = '';
            for (const [date, dateMatches] of Object.entries(fixturesByDate)) {
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';
                dateGroup.innerHTML = `<div class="date-header">${date}</div>`;
                const matchesList = document.createElement('div');
                dateMatches.forEach(match => {
                    const team1Name = match.T1?.[0]?.Nm || 'Unknown';
                    const team2Name = match.T2?.[0]?.Nm || 'Unknown';
                    const team1Logo = getTeamLogo(team1Name);
                    const team2Logo = getTeamLogo(team2Name);
                    const matchTime = formatTime(parseEsdDate(match.Esd));
                    const matchElement = document.createElement('div');
                    matchElement.className = 'match-card';
                    matchElement.innerHTML = `
                        <div class="team T1">
                            <span class="team-name">${team1Name}</span>
                            <img src="${team1Logo}" alt="${team1Name} Logo">
                        </div>
                        <span class="time">${matchTime}</span>
                        <div class="team right T2">
                            <span class="team-name">${team2Name}</span>
                            <img src="${team2Logo}" alt="${team2Name} Logo">
                        </div>
                    `;
                    matchesList.appendChild(matchElement);
                });
                dateGroup.appendChild(matchesList);
                fixturesContainer.appendChild(dateGroup);
            }

            // Results: Group by date
            const resultsByDate = {};
            results.forEach(match => {
                const date = parseEsdDate(match.Esd);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                if (!resultsByDate[formattedDate]) {
                    resultsByDate[formattedDate] = [];
                }
                resultsByDate[formattedDate].push(match);
            });

            resultsContainer.innerHTML = '';
            for (const [date, dateMatches] of Object.entries(resultsByDate)) {
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';
                dateGroup.innerHTML = `<div class="date-header">${date}</div>`;
                const matchesList = document.createElement('div');
                dateMatches.forEach(match => {
                    const team1Name = match.T1?.[0]?.Nm || 'Unknown';
                    const team2Name = match.T2?.[0]?.Nm || 'Unknown';
                    const team1Logo = getTeamLogo(team1Name);
                    const team2Logo = getTeamLogo(team2Name);
                    const matchElement = document.createElement('div');
                    matchElement.className = 'match-card';
                    matchElement.innerHTML = `
                        <div class="team T1">
                            <span class="team-name">${team1Name}</span>
                            <img src="${team1Logo}" alt="${team1Name} Logo">
                        </div>
                        <span class="score">${match.Tr1 || 0} - ${match.Tr2 || 0}</span>
                        <div class="team right T2">
                            <span class="team-name">${team2Name}</span>
                            <img src="${team2Logo}" alt="${team2Name} Logo">
                        </div>
                    `;
                    matchesList.appendChild(matchElement);
                });
                dateGroup.appendChild(matchesList);
                resultsContainer.appendChild(dateGroup);
            }
        } catch (error) {
            fixturesError.textContent = `Error: ${error.message}`;
            resultsError.textContent = `Error: ${error.message}`;
            fixturesError.classList.remove('hidden');
            resultsError.classList.remove('hidden');
        }
    };

    // Table Section
    const fetchTable = async () => {
        const url = 'https://livescore6.p.rapidapi.com/leagues/v2/get-table?Category=soccer&Ccd=spain&Scd=laliga';
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '644c313eb1msh54941d04889366cp18e9f9jsn5ba62ab2afde',
                'x-rapidapi-host': 'livescore6.p.rapidapi.com'
            }
        };

        const tableContainer = document.getElementById('league-table');
        const tableError = document.getElementById('table-error');

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            const teams = result.LeagueTable?.L?.[0]?.Tables?.[0]?.team || [];

            tableContainer.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Position</th>
                            <th class="tdname">Club</th>
                            <th>GP</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>GD</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teams.map((team, index) => {
                            let rowClass = '';
                            const position = index + 1;
                            if (position <= 4) {
                                rowClass = 'top-4';
                            } else if (position === 5) {
                                rowClass = 'position-5';
                            } else if (position === 6) {
                                rowClass = 'position-6';
                            } else if (position >= teams.length - 2) {
                                rowClass = 'bottom-3';
                            }
                            return `
                                <tr class="${rowClass}">
                                    <td>${position}</td>
                                    <td class="tdname">
                                        <img src="${getTeamLogo(team.Tnm)}" alt="${team.Tnm} Logo">
                                        ${team.Tnm || 'Unknown'}
                                    </td>
                                    <td>${team.pld || 0}</td>
                                    <td>${team.win || 0}</td>
                                    <td>${team.drw || 0}</td>
                                    <td>${team.lst || 0}</td>
                                    <td>${team.gd || 0}</td>
                                    <td>${team.ptsn || 0}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            tableError.textContent = `Error: ${error.message}`;
            tableError.classList.remove('hidden');
        }
    };

    // Initialize
    fetchMatches();
    fetchTable();
});