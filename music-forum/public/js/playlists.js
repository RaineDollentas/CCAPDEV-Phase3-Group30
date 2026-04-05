// Simple client-side playlists definition
// Each playlist references song indexes (positions) from the `songs` array
window.playlists = [
  {
    id: 'pl-1',
    title: 'Chill Guitar Moods',
    description: 'Laid-back guitar tracks for late-night listening.',
    songIndexes: [0,1,2,3,4]
  },
  {
    id: 'pl-2',
    title: 'Classic Rock Essentials',
    description: 'Iconic rock tracks that shaped generations.',
    songIndexes: [5,6,7,8,9]
  },
  {
    id: 'pl-3',
    title: 'Late Night Vibes',
    description: 'Moody and atmospheric songs for late drives.',
    songIndexes: [10,11,12,13,14]
  }
];

// Expose helper to find playlist by id
window.getPlaylistById = function(id) {
  return (window.playlists || []).find(p => p.id === id) || null;
};
