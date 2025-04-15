// TMDB API Constants
const API_KEY = '505c4a449d62a863815ffbafea6cbeb2';
const BASE_URL = 'https://api.themoviedb.org/3';
const SEARCH_ENDPOINT = '/search/multi';
const MOVIE_ENDPOINT = '/movie';
const TV_ENDPOINT = '/tv';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w92';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
// Create a simple SVG data URL for the default poster
const DEFAULT_POSTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0MCA2MCIgZmlsbD0iIzIyMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIyMCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
const DEFAULT_POSTER_LARGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9IiMyMjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iMTUwIiB5PSIyMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// DOM Elements - Initialize on DOM ready
let searchInput;
let suggestionsContainer;
let movieModal;
let closeModalBtn;
let modalPoster;
let movieTitle;
let movieDirector;
let movieType;
let movieRating;
let releaseYear;
let duration;
let imdbRating;
let movieDescription;
let starRating;
let navItems;
let movieGenres;

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Function to fetch content suggestions from TMDB API (movies, TV shows, etc.)
async function fetchContentSuggestions(query) {
    if (!query || query.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(
            `${BASE_URL}${SEARCH_ENDPOINT}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`
        );
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        // Filter out person results - we only want movies and TV shows
        const filteredResults = data.results.filter(item => 
            item.media_type === 'movie' || item.media_type === 'tv'
        ).slice(0, 8); // Limit to 8 suggestions
        
        await displaySuggestions(filteredResults);
    } catch (error) {
        console.error('Error fetching content suggestions:', error);
    }
}

// Function to fetch director for a movie
async function fetchDirector(id, mediaType) {
    try {
        const endpoint = mediaType === 'movie' ? MOVIE_ENDPOINT : TV_ENDPOINT;
        const response = await fetch(
            `${BASE_URL}${endpoint}/${id}/credits?api_key=${API_KEY}`
        );
        
        if (!response.ok) {
            return 'Unknown';
        }
        
        const data = await response.json();
        
        // For movies: find the director
        if (mediaType === 'movie') {
            const director = data.crew.find(person => person.job === 'Director');
            return director ? director.name : 'Unknown';
        } 
        // For TV shows: find the creator or executive producer
        else {
            const creator = data.crew.find(person => 
                person.job === 'Creator' || person.job === 'Executive Producer'
            );
            return creator ? creator.name : 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching director:', error);
        return 'Unknown';
    }
}

// Function to display content suggestions
async function displaySuggestions(items) {
    suggestionsContainer.innerHTML = '';
    
    if (items.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    // Create a placeholder for each item
    items.forEach((item, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.dataset.id = item.id;
        suggestionItem.dataset.mediaType = item.media_type;
        
        const posterPath = item.poster_path 
            ? `${IMAGE_BASE_URL}${item.poster_path}` 
            : DEFAULT_POSTER;
        
        const title = item.media_type === 'movie' ? item.title : item.name;
        const releaseDate = item.media_type === 'movie' ? item.release_date : item.first_air_date;
        const releaseYear = releaseDate ? releaseDate.substring(0, 4) : '';
        
        suggestionItem.innerHTML = `
            <img src="${posterPath}" alt="${title}" onerror="this.src='${DEFAULT_POSTER}'">
            <div class="title-container">
                <span class="title">${title} ${releaseYear ? `(${releaseYear})` : ''}</span>
                <span class="director" id="director-${index}">Loading...</span>
            </div>
        `;
        
        // Add click event listener to open modal
        suggestionItem.addEventListener('click', () => {
            console.log('Suggestion clicked:', item);
            if (item.media_type === 'movie') {
                fetchMovieDetails(item.id);
            } else {
                fetchTVDetails(item.id);
            }
            // Hide suggestions after selection
            suggestionsContainer.style.display = 'none';
        });
        
        suggestionsContainer.appendChild(suggestionItem);
        
        // Fetch director name asynchronously
        fetchDirector(item.id, item.media_type).then(directorName => {
            const directorElem = document.getElementById(`director-${index}`);
            if (directorElem) {
                directorElem.textContent = `Dir: ${directorName}`;
            }
        });
    });
    
    suggestionsContainer.style.display = 'block';
}

// Function to fetch TV show details
async function fetchTVDetails(tvId) {
    try {
        console.log('Fetching TV details for ID:', tvId);
        const tvResponse = await fetch(
            `${BASE_URL}${TV_ENDPOINT}/${tvId}?api_key=${API_KEY}&append_to_response=credits,content_ratings`
        );
        
        if (!tvResponse.ok) {
            throw new Error('Network response was not ok');
        }
        
        const tvData = await tvResponse.json();
        displayTVDetails(tvData);
        
        // Also populate cast & crew data
        populateCastAndCrew(tvData);
        
    } catch (error) {
        console.error('Error fetching TV details:', error);
    }
}

// Function to display TV show details
function displayTVDetails(show) {
    console.log('Displaying TV show details:', show);
    if (!show) {
        console.error('No TV show data provided');
        return;
    }

    // Set poster
    const posterUrl = show.poster_path 
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : DEFAULT_POSTER_LARGE;
    modalPoster.src = posterUrl;
    modalPoster.alt = show.name;

    // Get director/creator name
    let director = 'Unknown';
    if (show.credits && show.credits.crew) {
        const creator = show.credits.crew.find(person => 
            person.job === 'Creator' || 
            person.job === 'Executive Producer'
        );
        if (creator) {
            director = creator.name;
        }
    }

    // Set title with director
    movieTitle.textContent = `${show.name} | Dir. ${director}`;

    // Set media type
    movieType.textContent = 'TV Series';

    // Set metadata
    const firstAirDate = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A';
    const episodeCount = show.number_of_episodes || 'N/A';
    const seasonCount = show.number_of_seasons || 'N/A';
    
    releaseYear.textContent = firstAirDate;
    duration.textContent = `${seasonCount} Seasons • ${episodeCount} Episodes`;
    imdbRating.textContent = show.vote_average ? `IMDB ${show.vote_average.toFixed(1)}` : '';

    // Reset star rating to show empty stars
    resetStarRating();
    starRating.style.display = 'block';

    // Set description
    movieDescription.textContent = show.overview || 'No description available';

    // Show the modal
    movieModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Function to fetch movie details from TMDB API
async function fetchMovieDetails(movieId) {
    try {
        console.log('Fetching movie details for ID:', movieId);
        // Fetch movie details
        const movieResponse = await fetch(
            `${BASE_URL}${MOVIE_ENDPOINT}/${movieId}?api_key=${API_KEY}&append_to_response=credits,release_dates`
        );
        
        if (!movieResponse.ok) {
            throw new Error('Network response was not ok');
        }
        
        const movieData = await movieResponse.json();
        displayMovieDetails(movieData);
        
        // Also populate cast & crew data
        populateCastAndCrew(movieData);
        
    } catch (error) {
        console.error('Error fetching movie details:', error);
    }
}

// Function to display movie details in the modal
function displayMovieDetails(movie) {
    console.log('Displaying movie details:', movie);
    if (!movie) {
        console.error('No movie data provided');
        return;
    }

    // Set poster
    const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : DEFAULT_POSTER_LARGE;
    modalPoster.src = posterUrl;
    modalPoster.alt = movie.title;

    // Get director name (from movie.credits.crew if available)
    let director = 'Unknown';
    if (movie.credits && movie.credits.crew) {
        const directorInfo = movie.credits.crew.find(person => person.job === 'Director');
        if (directorInfo) {
            director = directorInfo.name;
        }
    }

    // Set title with director
    movieTitle.textContent = `${movie.title} | Dir. ${director}`;

    // Set media type
    movieType.textContent = 'Movie';

    // Get the original release year
    let premierYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    
    // Set metadata
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
    
    // Set certification/rating
    let certification = 'Not Rated';
    if (movie.release_dates && movie.release_dates.results) {
        const usRating = movie.release_dates.results.find(release => release.iso_3166_1 === 'US');
        if (usRating && usRating.release_dates && usRating.release_dates.length > 0) {
            certification = usRating.release_dates[0].certification || 'Not Rated';
        }
    }
    
    movieRating.textContent = certification;
    releaseYear.textContent = premierYear;
    duration.textContent = runtime;
    imdbRating.textContent = movie.vote_average ? `IMDB ${movie.vote_average.toFixed(1)}` : '';

    // Reset star rating to show empty stars
    resetStarRating();
    starRating.style.display = 'block';

    // Set description
    movieDescription.textContent = movie.overview || 'No description available';

    // Show the modal
    movieModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Function to update star rating display based on TMDB rating
function updateStarRating(rating) {
    resetStarRating();
    setDisplayRating(rating);
}

// Initialize interactive star rating
function initializeStarRating() {
    const starRating = document.getElementById('starRating');
    const starContainers = starRating.querySelectorAll('.star-container');
    const starHalves = starRating.querySelectorAll('.star-half');
    const ratingText = starRating.querySelector('.rating-text');
    let userRating = 0;
    
    // Update the rating text
    function updateRatingText(rating) {
        ratingText.textContent = rating > 0 ? rating.toFixed(1) : '';
    }
    
    // Set visual rating display
    function setDisplayRating(rating) {
        if (rating <= 0) return;
        
        starContainers.forEach(container => {
            const containerValue = parseFloat(container.dataset.value);
            
            if (containerValue <= rating) {
                // Full star
                container.classList.add('active');
            } else if (containerValue - 0.5 <= rating) {
                // Half star
                container.classList.add('half-active');
            }
        });
        
        updateRatingText(rating);
    }
    
    // Handle hover on star halves
    starHalves.forEach(half => {
        half.addEventListener('mouseenter', () => {
            resetStarRating();
            const hoverValue = parseFloat(half.dataset.value);
            
            starContainers.forEach(container => {
                const containerValue = parseFloat(container.dataset.value);
                
                if (containerValue <= hoverValue) {
                    container.classList.add('hover');
                } else if (containerValue - 0.5 <= hoverValue) {
                    container.classList.add('half-active');
                }
            });
            
            // Don't update rating text on hover
        });
        
        // Handle click on star halves
        half.addEventListener('click', () => {
            userRating = parseFloat(half.dataset.value);
            resetStarRating();
            setDisplayRating(userRating);
            
            // Here you could send the rating to your backend
            console.log('User selected rating:', userRating);
        });
    });
    
    // Handle mouse leave from rating container
    starRating.addEventListener('mouseleave', () => {
        resetStarRating();
        if (userRating > 0) {
            setDisplayRating(userRating);
        } else {
            ratingText.textContent = '';
        }
    });
}

// Reset star appearance
function resetStarRating() {
    const starContainers = document.querySelectorAll('.star-container');
    starContainers.forEach(container => {
        container.classList.remove('active', 'half-active', 'hover');
    });
}

// Set visual rating display
function setDisplayRating(rating) {
    if (rating <= 0) return;
    
    const starContainers = document.querySelectorAll('.star-container');
    const ratingText = document.querySelector('.rating-text');
    
    starContainers.forEach(container => {
        const containerValue = parseFloat(container.dataset.value);
        
        if (containerValue <= rating) {
            // Full star
            container.classList.add('active');
        } else if (containerValue - 0.5 <= rating) {
            // Half star
            container.classList.add('half-active');
        }
    });
    
    if (ratingText) {
        ratingText.textContent = rating > 0 ? rating.toFixed(1) : '';
    }
}

// Close modal when clicking the X
function closeModal() {
    movieModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Function to populate cast and crew sections
function populateCastAndCrew(data) {
    const container = document.getElementById('castAndCrewContainer');
    container.innerHTML = '';
    
    if (!data.credits) return;
    
    const { crew, cast } = data.credits;
    const allMembers = [];
    
    // Helper function to add crew member with role type
    function addCrewMember(person, roleType) {
        allMembers.push({
            ...person,
            roleType,
            displayRole: person.job,
            sortOrder: getSortOrder(roleType)
        });
    }
    
    // Get sort order for different roles
    function getSortOrder(roleType) {
        const orderMap = {
            'Director': 1,
            'Cast': 2,
            'Screenplay': 3,
            'Cinematography': 4,
            'Other': 5
        };
        return orderMap[roleType] || 5;
    }
    
    // Process directors
    crew.filter(person => person.job === 'Director')
        .forEach(director => addCrewMember(director, 'Director'));
    
    // Add cast members
    if (cast) {
        cast.forEach(actor => {
            allMembers.push({
                ...actor,
                roleType: 'Cast',
                displayRole: actor.character || 'Unknown role',
                sortOrder: 2
            });
        });
    }
    
    // Process screenwriters
    crew.filter(person => 
        person.job === 'Screenplay' || 
        person.job === 'Writer' ||
        person.job === 'Story'
    ).forEach(writer => addCrewMember(writer, 'Screenplay'));
    
    // Process cinematographers
    crew.filter(person => 
        person.job === 'Director of Photography' ||
        person.job === 'Cinematography'
    ).forEach(dp => addCrewMember(dp, 'Cinematography'));
    
    // Process other crew members
    crew.filter(person => 
        person.job !== 'Director' &&
        person.job !== 'Screenplay' &&
        person.job !== 'Writer' &&
        person.job !== 'Story' &&
        person.job !== 'Director of Photography' &&
        person.job !== 'Cinematography'
    ).forEach(crewMember => addCrewMember(crewMember, 'Other'));
    
    // Sort members by role order and render
    allMembers.sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach(member => {
            const card = document.createElement('div');
            card.className = 'cast-card';
            
            // Strict validation for profile path
            const hasValidProfilePath = member.profile_path && 
                                      typeof member.profile_path === 'string' && 
                                      member.profile_path.trim().length > 0;

            // Create a placeholder div for the photo that will be lazy loaded
            const photoContainer = document.createElement('div');
            photoContainer.className = 'cast-photo no-image';
            
            if (hasValidProfilePath) {
                // Set data attribute for the image URL
                photoContainer.dataset.imageUrl = `https://image.tmdb.org/t/p/w200${member.profile_path}`;
                photoContainer.innerHTML = '<i class="fas fa-user"></i>';
            } else {
                photoContainer.innerHTML = '<i class="fas fa-user"></i>';
            }
            
            card.innerHTML = `
                <div class="cast-details">
                    <div class="cast-name">${member.name}</div>
                    <div class="cast-character">${member.displayRole}</div>
                </div>
            `;
            
            card.insertBefore(photoContainer, card.firstChild);
            container.appendChild(card);
        });
    
    // Set up Intersection Observer for lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;
                const imageUrl = container.dataset.imageUrl;
                
                if (imageUrl) {
                    const img = new Image();
                    img.className = 'cast-photo';
                    img.alt = container.nextElementSibling.querySelector('.cast-name').textContent;
                    
                    img.onload = () => {
                        container.parentNode.replaceChild(img, container);
                    };
                    
                    img.onerror = () => {
                        // Keep the default user icon if image fails to load
                        container.removeAttribute('data-image-url');
                    };
                    
                    img.src = imageUrl;
                    observer.unobserve(container);
                }
            }
        });
    }, {
        rootMargin: '50px 0px', // Start loading images when they're 50px from entering the viewport
        threshold: 0.1
    });
    
    // Observe all photo containers that have an image URL
    document.querySelectorAll('.cast-photo[data-image-url]').forEach(container => {
        imageObserver.observe(container);
    });
    
    // Initialize scroll arrows
    initializeCastScroll();
}

// Initialize cast scroll functionality
function initializeCastScroll() {
    console.log('Initializing cast scroll...');
    
    const container = document.getElementById('castAndCrewContainer');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');

    if (!container || !leftArrow || !rightArrow) {
        console.error('Required elements for cast scroll not found');
        return;
    }

    // Remove existing handlers by cloning and replacing elements
    const newLeftArrow = leftArrow.cloneNode(true);
    const newRightArrow = rightArrow.cloneNode(true);
    leftArrow.parentNode.replaceChild(newLeftArrow, leftArrow);
    rightArrow.parentNode.replaceChild(newRightArrow, rightArrow);

    // Scroll amount calculation
    const scrollAmount = 200;

    // Left arrow handler with smooth scroll
    newLeftArrow.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Left arrow clicked');
        
        const targetScroll = Math.max(0, container.scrollLeft - scrollAmount);
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        
        console.log('Scrolling to:', targetScroll);
        updateArrowVisibility();
    });

    // Right arrow handler with smooth scroll
    newRightArrow.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Right arrow clicked');
        
        const maxScroll = container.scrollWidth - container.clientWidth;
        const targetScroll = Math.min(maxScroll, container.scrollLeft + scrollAmount);
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        
        console.log('Scrolling to:', targetScroll);
        updateArrowVisibility();
    });

    function updateArrowVisibility() {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const maxScroll = scrollWidth - clientWidth;
        
        // More precise scroll position detection
        const isAtStart = Math.abs(scrollLeft) < 1;
        const isAtEnd = Math.abs(maxScroll - scrollLeft) < 1;
        
        newLeftArrow.style.display = isAtStart ? 'none' : 'flex';
        newRightArrow.style.display = isAtEnd ? 'none' : 'flex';
        
        console.log('Scroll state:', {
            scrollLeft,
            maxScroll,
            isAtStart,
            isAtEnd,
            leftVisible: !isAtStart,
            rightVisible: !isAtEnd
        });
    }

    // Update visibility on scroll with debounce
    let scrollTimeout;
    container.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateArrowVisibility, 100);
    });

    // Initial visibility check
    updateArrowVisibility();
    
    // Additional check after images load
    const images = container.querySelectorAll('img');
    images.forEach(img => {
        if (img.complete) {
            updateArrowVisibility();
        } else {
            img.addEventListener('load', updateArrowVisibility);
        }
    });
}

// Filter cast and crew based on selection
function filterCastAndCrew(filter) {
    const container = document.getElementById('castAndCrewContainer');
    const cards = container.querySelectorAll('.cast-card');
    
    cards.forEach(card => {
        if (filter === 'all' || card.dataset.roleType === filter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Reset scroll position and update arrow states
    container.scrollLeft = 0;
    initializeCastScroll();
}

// Handle tab navigation
function handleTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const movieSections = document.querySelectorAll('.movie-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Get section to show
            const sectionToShow = item.dataset.section;
            
            // Remove active class from all tabs and sections
            navItems.forEach(tab => tab.classList.remove('active'));
            movieSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to selected tab and section
            item.classList.add('active');
            const selectedSection = document.getElementById(`${sectionToShow}Section`);
            if (selectedSection) {
                selectedSection.classList.add('active');
            }
        });
    });
}

// Initialize everything when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Initialize DOM elements
    searchInput = document.getElementById('searchInput');
    suggestionsContainer = document.getElementById('suggestions');
    movieModal = document.getElementById('movieModal');
    closeModalBtn = document.querySelector('.close-modal');
    modalPoster = document.getElementById('modalPoster');
    movieTitle = document.getElementById('movieTitle');
    movieDirector = document.getElementById('movieDirector');
    movieType = document.getElementById('movieType');
    movieRating = document.getElementById('movieRating');
    releaseYear = document.getElementById('releaseYear');
    duration = document.getElementById('duration');
    imdbRating = document.getElementById('imdbRating');
    movieDescription = document.getElementById('movieDescription');
    starRating = document.getElementById('starRating');
    navItems = document.querySelectorAll('.nav-item');
    movieGenres = document.getElementById('movieGenres');
    
    // Set up event listeners
    const debouncedSearch = debounce(fetchContentSuggestions, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value.trim());
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Handle focus on search input
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 1) {
            debouncedSearch(searchInput.value.trim());
        }
    });
    
    // Close modal when clicking the X
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            closeModal();
        }
    });
    
    // Close modal on escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && movieModal.style.display === 'block') {
            closeModal();
        }
    });
    
    // Handle navigation tabs
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(tab => tab.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Initialize star rating
    initializeStarRating();
    
    // Initialize tab navigation
    handleTabNavigation();
    
    console.log('App initialization complete');
}); 