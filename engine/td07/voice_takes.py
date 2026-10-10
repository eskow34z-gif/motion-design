#!/usr/bin/env python3
"""Temps de début de chaque mot (transcription ElevenLabs Scribe) des 4 prises « Léo » du script TD07.
On reconnaît la prise reçue à la durée de son MP3 (ffprobe), puis on écrit voice.json pour la scène."""
W = ["Tu","lèves","la","main","depuis","la","rentrée.","Ton","prof","est","absent","?","Remplacé","par…","personne.",
     "Il","y","a","deux","ans,","presque","une","heure","de","cours","sur","dix","a","sauté.","Et","quand","tu","râles,",
     "on","te","met…","en","mode","silencieux.","Alors","cette","fois,","vous","êtes","des","milliers","à","lever","la","main.",
     "Et","là,","d'un","coup",":","trois","mille","profs","annoncés","en","renfort.","Comme","quoi…","quand","tu","parles,","ça","compte."]
TAKES = {
 1: dict(dur=20.08, gen='96Ze89UDNjwIM6TLL2ZA', s=[0,0.2,0.4,0.56,0.72,0.92,1.04,1.76,2,2.12,2.28,2.56,2.96,3.6,4.48,5.28,5.387,5.44,5.56,5.76,6.2,6.56,6.72,6.88,7.04,7.28,7.44,7.76,7.92,8.6,8.68,8.88,9.04,9.48,9.6,9.76,10.36,10.48,10.72,11.6,11.84,12.08,12.48,12.64,12.8,13.04,13.48,13.64,13.8,13.92,14.36,14.48,14.84,15.04,15.52,15.627,15.84,16,16.44,16.76,16.92,17.64,17.84,18.507,18.64,18.88,19.44,19.6], end=20.16),
 2: dict(dur=19.84, gen='27eBE2OlHLUS1HRf8zYw', s=[0,0.2,0.4,0.56,0.72,0.92,1.04,1.76,1.92,2.12,2.24,2.56,2.96,3.6,4.56,5.36,5.467,5.52,5.64,5.84,6.28,6.64,6.8,6.96,7.093,7.32,7.48,7.76,7.92,8.6,8.68,8.88,9,9.48,9.6,9.76,10.44,10.56,10.8,11.72,11.973,12.16,12.56,12.72,12.92,13.16,13.48,13.64,13.8,13.92,14.36,14.48,14.773,14.96,15.44,15.547,15.76,15.92,16.24,16.64,16.8,17.56,17.76,18.36,18.56,18.72,19.28,19.44], end=19.92),
 3: dict(dur=19.60, gen='CzXnoWDirFxszzEfzzxq', s=[0,0.2,0.4,0.48,0.68,0.88,1.04,1.68,1.92,2.08,2.24,2.613,2.88,3.64,4.32,5.08,5.2,5.307,5.4,5.6,6,6.4,6.56,6.72,6.853,7.08,7.24,7.52,7.68,8.36,8.44,8.64,8.8,9.24,9.36,9.52,10.16,10.32,10.48,11.4,11.653,11.84,12.24,12.4,12.6,12.84,13.16,13.32,13.48,13.6,14.04,14.16,14.533,14.72,15.2,15.307,15.52,15.76,16.12,16.44,16.6,17.32,17.52,18.12,18.32,18.48,19,19.12], end=19.68),
 4: dict(dur=20.16, gen='pz7nRKkhvSZN8vcLZmKv', s=[0,0.2,0.4,0.56,0.72,0.92,1.04,1.76,1.92,2.12,2.28,2.88,2.96,3.6,4.56,5.36,5.48,5.6,5.72,5.92,6.32,6.72,6.88,7.04,7.16,7.44,7.6,7.92,8.08,8.76,8.84,9.04,9.16,9.64,9.76,9.92,10.6,10.72,10.96,11.84,12.08,12.32,12.72,12.88,13.08,13.32,13.64,13.8,13.96,14.08,14.52,14.64,15.013,15.2,15.68,15.787,15.92,16.16,16.48,16.92,17.04,17.8,18,18.6,18.8,18.96,19.52,19.68], end=20.24),
}
if __name__ == '__main__':
    import json, subprocess, sys
    if len(sys.argv) < 3:
        sys.exit('usage: voice_takes.py voix.mp3 sortie.json')
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', sys.argv[1]]).decode())
    k = min(TAKES, key=lambda i: abs(TAKES[i]['dur'] - d))
    assert all(len(t['s']) == len(W) for t in TAKES.values())
    json.dump({'take': k, 'dur': d, 'words': [[w, s] for w, s in zip(W, TAKES[k]['s'])], 'end': TAKES[k]['end']}, open(sys.argv[2], 'w'), ensure_ascii=False)
    print(f'prise {k} (durée {d:.2f} s, écart {abs(TAKES[k]["dur"] - d):.3f} s)')
