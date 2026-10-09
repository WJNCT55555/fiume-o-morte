// The Rapallo-era Italian / S.H.S. division at the Castua / Mattuglie /
// Volosca corridor, traced from a historical border map and georeferenced
// with six named places. At game start (September 1919) this line must NOT
// be used: Italian troops occupied Kastav until 26 May 1921. The physical
// coast lives in coast.js. The eastern field denotes the S.H.S. hinterland;
// Sušak's Italian occupation is displayed separately until 3 March 1923.
// Sources:
// https://fiumetrieste.blogspot.com/2018/05/i-confini-del-novecento-lo-stato-libero.html
// https://granice.ppmhp.hr/en/kastavstina-between-wars/
window.FIUME_GEO_CONTEXT = {
  rapalloWestEdge: [
    [14.310000, 45.470000], [14.322000, 45.432000], [14.328000, 45.416000],
    [14.337000, 45.406000], [14.344040, 45.396633],
    [14.343654, 45.391891], [14.343488, 45.387284],
    [14.343772, 45.383085], [14.343134, 45.380374],
    [14.341663, 45.377663], [14.339600, 45.375356],
    [14.336341, 45.373726], [14.333476, 45.371825],
    [14.330206, 45.370059], [14.328812, 45.368296],
    [14.328252, 45.366534], [14.327066, 45.364771],
    [14.328624, 45.363418], [14.331729, 45.363152],
    [14.334778, 45.362208], [14.337872, 45.361806],
    [14.340746, 45.361269], [14.342732, 45.360052],
    [14.340493, 45.358152], [14.338254, 45.356252],
    [14.335598, 45.354352], [14.333787, 45.352588],
    [14.331493, 45.350010]
  ],
  labels: [
    { id: 'italy', lon: 14.364, lat: 45.380, text: 'ITALIA' },
    { id: 'shs', lon: 14.465, lat: 45.379, text: 'REGNO S.H.S.' },
    { id: 'adriatic', lon: 14.415, lat: 45.307, text: 'MARE ADRIATICO' }
  ]
};
