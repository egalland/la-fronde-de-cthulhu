# R’lyeh — La chair des abysses

[Jouer](https://egalland.github.io/la-fronde-de-cthulhu/) · [Calendrier Inktober](https://egalland.github.io/)

Les sources et assets du jeu se trouvent dans `docs/`. Pour développer : `python -m http.server 8080 --directory docs`, puis ouvrir http://localhost:8080. Tir à la souris sur PC, au doigt ou au stylet sur écran tactile. Tests : `npm test` (Node.js, sans installation de dépendances). Le code est public ; aucune licence de redistribution n’est ajoutée par défaut.

Jeu de fronde 2D organique : Lovecraft contre l’humanité. HTML/CSS/Canvas 2D, sans dépendance client. Sauvegardes locales `rlyeh-war-v2`.

## Temps de réalisation estimés

- Vibe coding : **4 h**, en incluant conception, essais, génération et intégration des assets, corrections et publication.
- Développement classique équivalent : **80 h**, avec une fourchette indicative de **60 à 100 h**, pour reproduire le prototype actuel : physique, cinq missions, six pouvoirs, sprites et interface PC/mobile.

Ces deux valeurs sont des estimations. Les dates de versions sont connues, mais l’historique récupérable ne permet pas de chronométrer l’ensemble des sessions ni le temps actif. La durée de vibe coding est marquée « Estimation » dans le calendrier Inktober.

## Combat et physique

Cinq missions différentes, cinq offrandes par mission, six pouvoirs et montée en puissance de Cthulhu. La victoire demande d’éliminer les défenseurs humains. Les anciennes lanternes-tours répétées ont été remplacées par des installations en bois, pierre et acier, des traverses, des rampes, des barils et quatre profils ennemis.

La munition reste active après un contact. Rebonds sur le sol, l’acier et les rampes, vitesse résiduelle à travers un matériau détruit, roulement puis repos. Elle disparaît au repos prolongé, hors du terrain ou après neuf secondes ; le premier choc ne la supprime plus. La scission remplace volontairement le projectile principal par cinq fragments.

Les structures ont une masse, une résistance, une restitution, des vitesses et une rotation visuelle. Un solveur de contacts gravitaires déplace les éléments, transfère des impulsions et gère les dégâts des débris. Barils explosifs avec réactions en chaîne. Les collisions de blocs utilisent des rectangles alignés sur les axes : la rotation visuelle est approximative, pas un solveur complet de polygones orientés. Quatre sous-pas et plusieurs itérations de contacts réduisent les traversées et stabilisent les piles. Les premiers niveaux peuvent se gagner en un tir bien placé ; les parcours de validation des suivants emploient deux tirs. Ces parcours prouvent qu’ils sont gagnables, pas qu’ils sont optimaux.

## Adversaires

- Fusilier : tir léger qui freine une offrande en approche.
- Scaphandrier : bouclier frontal réfléchissant, moins résistant à un impact venant du dessus.
- Occultiste : préparation, barrière intermittente et déviation réelle des munitions proches.
- Canon naval : préparation, recul et boulets qui interceptent les offrandes.

Les humains ne blessent pas une barre de vie de Cthulhu ; leurs tirs et barrières perturbent les offrandes. Ils réagissent à l’approche et aux coups, et alternent des poses d’attente avant les tirs. Une fiche consultable décrit chaque profil et ses contre-mesures.

## Animation

Les images restent détaillées et organiques. L’inspiration arcade/Metal Slug porte sur la préparation, les poses d’action, le recul, les réactions aux coups et les effets d’impact ; aucun sprite original de ces jeux n’est utilisé.

40 poses initiales : quatre par créature, huit pour Cthulhu et la fronde. Ajout de 16 poses pour les quatre adversaires (repos, préparation, action, réaction) et de huit poses d’effets (explosion et impact organique). Les cellules source sont sélectionnées explicitement selon l’état du combat. Déclenchement de la fronde, poses de vol et d’impact, réactions ennemies, explosions image par image, courtes pauses d’impact, éclats et indicateur de chaîne. Aucun étirement oscillant ni déformation d’une image ne produit l’animation des corps.

Les planches ont quatre ou huit poses ; cette direction n’équivaut pas à la richesse d’animation complète de Metal Slug. Le décor reste commun aux cinq missions ; leurs défenses et matériaux changent.

## Souris, tactile, orientation, interface

Tir par glissement depuis la fronde et relâchement : clic gauche maintenu sur PC, doigt ou stylet sur écran tactile. Un clic simple, le clic droit, un second pointeur ou une annulation ne consomment pas de munition. En vol, clic/toucher sur la scène ou bouton du pouvoir ; Espace sur PC lorsque le focus n’est pas sur un contrôle. Changement de fenêtre, perte de capture, redimensionnement et ouverture d’un panneau annulent le geste sans tirer. Les panneaux suspendent le combat.

Sur PC (pointeur fin disponible), entrée directe en fenêtre, y compris après redimensionnement en portrait ; le plein écran est facultatif et sa sortie ne bloque pas le jeu. Sur appareil uniquement tactile, un toucher à l’entrée demande le plein écran puis le verrouillage paysage. Si les API sont refusées, le jeu reste utilisable en fenêtre paysage. Sur appareil uniquement tactile, en portrait ou à la sortie d’un plein écran accordé, la partie se suspend. Manifeste fullscreen/standalone et paysage ; pas de promesse d’application native ou de cache hors ligne. Références : https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen et https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock.

## Validation

`node --check docs/game2d.mjs`

`node --test tests/*.test.mjs`

Tests : progression/sauvegarde, API immersives et refus, lecteur de sprites, stabilité des cinq installations, rebond réel et persistance du projectile, bois traversé et acier réfléchissant, fin de repos, six pouvoirs, réactions en chaîne, dégâts par débris, tirs du canon, blindage frontal, barrière intermittente et campagne gagnable aux rangs requis.

Exécution Canvas native hors navigateur, ordinateur et mobile paysage : textures, fiches de défenseurs, sélection des offrandes, glissement tactile, vol après activation, paysage/portrait et sortie de plein écran. Rendus de scène et d’adversaires inspectés. Ce contrôle ne valide pas la mise en page DOM/CSS, les performances d’un téléphone ni l’acceptation des API par un navigateur réel ; le contrôle navigateur n’est pas disponible ici.

Correctif PC : scénarios exécutés sur les gestionnaires réels du jeu avec le moteur physique, dans un DOM simulé (clic/glissement, pouvoir, annulation, plein écran, redimensionnement et tactile). Le contrôle navigateur est indisponible pour ce correctif ; affichage DOM/CSS et interaction Windows/Chrome restent à confirmer sur navigateur réel.
