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
        "Levante": "images/levante.png",
        "Elche": "images/elche.png",
        "Real Oviedo": "images/real-oviedo.png"
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

    const fetchMatches = async () => {
    const url = 'https://livescore6.p.rapidapi.com/matches/v2/list-by-league?Category=soccer&Ccd=spain&Scd=laliga&Timezone=5.75';
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '9a93c5428amshb127fac77f6dd2cp1c84f6jsnca7748c58c60',
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

        // Sort all matches ascending to calculate matchdays
        const allMatches = [...matches].sort((a, b) => parseEsdDate(a.Esd) - parseEsdDate(b.Esd));

        // Assign matchday with 10 games per matchday, handling August 28, 2025 for Matchday 6
        const matchToDay = {};
        let matchDayCounter = 0;
        let gamesInCurrentMatchday = 0;
        let august28Match = null;
        const regularMatches = [];

        // Separate August 28, 2025 match and regular matches
        allMatches.forEach(match => {
            const matchDate = parseEsdDate(match.Esd);
            const isAugust28 = matchDate.getFullYear() === 2025 &&
                              matchDate.getMonth() === 7 && // August (0-based)
                              matchDate.getDate() === 28;
            if (isAugust28) {
                august28Match = match;
            } else {
                regularMatches.push(match);
            }
        });

        // Assign matchdays for regular matches
        regularMatches.forEach((match, index) => {
            if (gamesInCurrentMatchday === 0) {
                matchDayCounter++;
            }
            // For Matchday 6, assign only 9 games
            if (matchDayCounter === 6 && gamesInCurrentMatchday < 9) {
                matchToDay[match.Eid] = `Matchday 6`;
                gamesInCurrentMatchday++;
            } else if (matchDayCounter === 6 && gamesInCurrentMatchday === 9) {
                matchDayCounter++; // Move to Matchday 7
                matchToDay[match.Eid] = `Matchday ${matchDayCounter}`;
                gamesInCurrentMatchday = 1; // Start counting for Matchday 7
            } else {
                matchToDay[match.Eid] = `Matchday ${matchDayCounter}`;
                gamesInCurrentMatchday++;
                if (gamesInCurrentMatchday === 10) {
                    gamesInCurrentMatchday = 0; // Start new matchday
                }
            }
        });

        // Assign August 28 match to Matchday 6
        if (august28Match) {
            matchToDay[august28Match.Eid] = 'Matchday 6';
            // Ensure Matchday 6 has exactly 10 games (9 regular + August 28)
            const matchday6Matches = Object.keys(matchToDay)
                .filter(eid => matchToDay[eid] === 'Matchday 6')
                .map(eid => allMatches.find(m => m.Eid === eid));
            if (matchday6Matches.length > 10) {
                // Move excess matches to the next matchday
                const excessMatches = matchday6Matches.slice(9, -1); // Exclude August 28 match
                excessMatches.forEach(match => {
                    matchToDay[match.Eid] = `Matchday ${matchDayCounter + 1}`;
                });
            }
        }

        // Separate fixtures and results
        const fixtures = matches.filter(match => match.Eps !== 'FT' && match.Eps !== 'HT');
        const results = matches.filter(match => match.Eps === 'FT' || match.Eps === 'HT');

        fixtures.sort((a, b) => parseEsdDate(a.Esd) - parseEsdDate(b.Esd));
        results.sort((a, b) => parseEsdDate(b.Esd) - parseEsdDate(a.Esd));

        // Function to get number from matchday string
        const getDayNumber = (matchDay) => {
            const match = matchDay.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        };

        // Fixtures: Group by matchday and date
        const fixturesByDay = {};
        fixtures.forEach(match => {
            const date = parseEsdDate(match.Esd);
            const matchDay = matchToDay[match.Eid] || 'Unassigned Matchday';
            const formattedDate = date.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            if (!fixturesByDay[matchDay]) {
                fixturesByDay[matchDay] = {};
            }
            if (!fixturesByDay[matchDay][formattedDate]) {
                fixturesByDay[matchDay][formattedDate] = [];
            }
            fixturesByDay[matchDay][formattedDate].push(match);
        });

        fixturesContainer.innerHTML = '';
        const fixturesDays = Object.keys(fixturesByDay).sort((a, b) => getDayNumber(a) - getDayNumber(b));
        for (const matchDay of fixturesDays) {
            const weekGroup = document.createElement('div');
            weekGroup.className = 'week-group';
            weekGroup.innerHTML = `<div class="MW-header">${matchDay}</div>`;
            const mwGames = document.createElement('div');
            mwGames.className = 'MW-games';
            const dates = Object.keys(fixturesByDay[matchDay]).sort((a, b) => new Date(a) - new Date(b));
            for (const date of dates) {
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';
                dateGroup.innerHTML = `<div class="date-header">${date}</div>`;
                const matchesList = document.createElement('div');
                matchesList.className = 'matches-list';
                fixturesByDay[matchDay][date].forEach(match => {
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
                mwGames.appendChild(dateGroup);
            }
            weekGroup.appendChild(mwGames);
            fixturesContainer.appendChild(weekGroup);
        }

        // Results: Group by matchday and date
        const resultsByDay = {};
        results.forEach(match => {
            const date = parseEsdDate(match.Esd);
            const matchDay = matchToDay[match.Eid] || 'Unassigned Matchday';
            const formattedDate = date.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            if (!resultsByDay[matchDay]) {
                resultsByDay[matchDay] = {};
            }
            if (!resultsByDay[matchDay][formattedDate]) {
                resultsByDay[matchDay][formattedDate] = [];
            }
            resultsByDay[matchDay][formattedDate].push(match);
        });

        resultsContainer.innerHTML = '';
        const resultsDays = Object.keys(resultsByDay).sort((a, b) => getDayNumber(b) - getDayNumber(a));
        for (const matchDay of resultsDays) {
            const weekGroup = document.createElement('div');
            weekGroup.className = 'week-group';
            weekGroup.innerHTML = `<div class="MW-header">${matchDay}</div>`;
            const mwGames = document.createElement('div');
            mwGames.className = 'MW-games';
            const dates = Object.keys(resultsByDay[matchDay]).sort((a, b) => new Date(b) - new Date(a));
            for (const date of dates) {
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';
                dateGroup.innerHTML = `<div class="date-header">${date}</div>`;
                const matchesList = document.createElement('div');
                matchesList.className = 'matches-list';
                resultsByDay[matchDay][date].forEach(match => {
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
                mwGames.appendChild(dateGroup);
            }
            weekGroup.appendChild(mwGames);
            resultsContainer.appendChild(weekGroup);
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
                'x-rapidapi-key': '9a93c5428amshb127fac77f6dd2cp1c84f6jsnca7748c58c60',
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
                            <th class="posH">Position</th>
                            <th>Club</th>
                            <th>GP</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>GD</th>
                            <th class="ptsH">PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teams.map((team, index) => {
                            let rowClass = '';
                            const position = index + 1;
                            if (position <= 5) {
                                rowClass = 'top-5';
                            } else if (position <= 7) {
                                rowClass = 'top-7';
                            } else if (position === 8) {
                                rowClass = 'position-8';
                            } else if (position >= teams.length - 2) {
                                rowClass = 'bottom-3';
                            }
                            return `
                                <tr class="${rowClass}">
                                    <td class="position">${position}</td>
                                    <td class="tdname">
                                        <img src="${getTeamLogo(team.Tnm)}" alt="${team.Tnm} Logo">
                                        ${team.Tnm || 'Unknown'}
                                    </td>
                                    <td>${team.pld || 0}</td>
                                    <td>${team.win || 0}</td>
                                    <td>${team.drw || 0}</td>
                                    <td>${team.lst || 0}</td>
                                    <td>${team.gd || 0}</td>
                                    <td class="points">${team.ptsn || 0}</td>
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