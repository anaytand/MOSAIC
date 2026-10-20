"""Generate MOSAIC's original CC0 loops without external samples or dependencies."""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
DURATION = 16
OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'audio'
OUTPUT.mkdir(parents=True, exist_ok=True)
for name in ['quiet-orbit', 'ocean-current', 'studio-air']:
    rng = random.Random(20261018)
    filtered = 0
    data = bytearray()
    for index in range(RATE * DURATION):
        time = index / RATE
        envelope = min(1, time / 1.5, (DURATION - time) / 1.5)
        if name == 'ocean-current':
            filtered = .985 * filtered + .015 * rng.uniform(-1, 1)
            value = filtered * .75 * (.65 + .35 * math.sin(2 * math.pi * time / 8))
        else:
            frequencies = [130.8128, 196, 261.6256] if name == 'quiet-orbit' else [146.8324, 220, 293.6648]
            value = sum(math.sin(2 * math.pi * frequency * time) * (.012 + .004 * math.sin(2 * math.pi * (time / DURATION + voice / 3))) for voice, frequency in enumerate(frequencies))
        data.extend(struct.pack('<h', round(max(-1, min(1, value * envelope)) * 32767)))
    with wave.open(str(OUTPUT / (name + '.wav')), 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(RATE)
        audio.writeframes(data)
