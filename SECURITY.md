# Sécurité de JDR Compagnon

## Signaler une faille

Écrivez à **services@noedio.fr** avec « Sécurité » dans l'objet : ce que vous avez trouvé, la version
de l'application (Réglages › Aide), et comment le reproduire. Merci de ne pas la rendre publique avant
qu'un correctif soit publié.

- Accusé de réception sous **72 heures**.
- Une première évaluation sous **7 jours**, puis des nouvelles au moins chaque semaine.
- Une faille activement exploitée est traitée en priorité (correctif, ou fonction coupée à distance en
  attendant) et signalée aux autorités dans les délais du Cyber Resilience Act.
- Si vous le souhaitez, votre nom est cité dans les notes de la version qui corrige.

## Versions suivies

Seule la **dernière version publiée** reçoit les correctifs ; l'application se met à jour d'elle-même
(signature de l'éditeur vérifiée). Electron et Chromium suivent la version stable la plus récente au
moment de chaque publication ; une faille de Chromium exploitée entraîne une version corrective.

## Ce qui est protégé

- Les mises à jour sont signées (Ed25519) et vérifiées avant installation ; une clé compromise peut être
  retirée à distance par la clé de secours.
- La table tourne sur le PC du MJ : rien n'est hébergé chez l'éditeur, en dehors des retours que vous
  choisissez d'envoyer (voir la politique de confidentialité).
- Le détail des règles de sécurité est dans `docs/ARCHITECTURE.md` (section Serveur et sécurité).
