import math
import random
import wave
from array import array
from pathlib import Path

SAMPLE_RATE = 22050
DURATION = 75
OUTPUT = Path(__file__).parent / "assets" / "toronto-first-snow.wav"
random.seed(3605)


def pulse(t, start, length, frequency, decay=8.0):
    dt = t - start
    if dt < 0 or dt > length:
        return 0.0
    envelope = math.exp(-dt * decay)
    return math.sin(2 * math.pi * frequency * dt) * envelope


def impact(t, start):
    dt = t - start
    if dt < 0 or dt > 0.24:
        return 0.0
    envelope = math.exp(-dt * 18)
    crunch = random.uniform(-1, 1) * envelope
    thump = math.sin(2 * math.pi * 105 * dt) * math.exp(-dt * 13)
    return crunch * 0.55 + thump * 0.45


footsteps = [
    5.8, 7.0, 8.2, 9.4,
    31.8, 33.0, 34.2, 35.4, 36.6,
    55.5, 56.7, 57.9, 59.1, 60.3,
]
bell_times = [14.0, 40.3, 61.0]

samples = array("h")
wind_state = 0.0

for index in range(SAMPLE_RATE * DURATION):
    t = index / SAMPLE_RATE
    noise = random.uniform(-1, 1)
    wind_state = wind_state * 0.996 + noise * 0.004
    wind_shape = 0.55 + 0.22 * math.sin(2 * math.pi * 0.035 * t)
    wind = wind_state * 3.7 * wind_shape + noise * 0.018

    city = (
        0.026 * math.sin(2 * math.pi * 55 * t)
        + 0.012 * math.sin(2 * math.pi * 110 * t)
        + 0.007 * math.sin(2 * math.pi * 165 * t)
    )

    crunch = sum(impact(t, step) for step in footsteps) * 0.34

    bell = 0.0
    for bell_time in bell_times:
        bell += pulse(t, bell_time, 1.5, 760, 2.8) * 0.16
        bell += pulse(t, bell_time, 1.5, 1120, 3.3) * 0.09
        bell += pulse(t, bell_time + 0.48, 1.2, 760, 3.0) * 0.12

    crosswalk = 0.0
    if 26.8 <= t <= 30.8:
        beat_start = 26.8 + math.floor((t - 26.8) / 0.48) * 0.48
        crosswalk = pulse(t, beat_start, 0.13, 1280, 16) * 0.12

    streetcar = 0.0
    if 44.0 <= t <= 53.0:
        position = (t - 44.0) / 9.0
        envelope = math.sin(math.pi * position)
        frequency = 175 - position * 62
        streetcar = (
            math.sin(2 * math.pi * frequency * t) * 0.048
            + random.uniform(-1, 1) * 0.025
        ) * envelope

    quieting = 1.0
    if t > 64:
        quieting = 1.0 - (t - 64) / 17
        quieting = max(0.35, quieting)

    value = (wind + city + crunch + bell + crosswalk + streetcar) * quieting
    fade_in = min(1.0, t / 2.0)
    fade_out = min(1.0, (DURATION - t) / 4.0)
    value *= fade_in * fade_out
    value = math.tanh(value * 1.8) * 0.78
    samples.append(int(max(-1, min(1, value)) * 32767))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUTPUT), "wb") as audio_file:
    audio_file.setnchannels(1)
    audio_file.setsampwidth(2)
    audio_file.setframerate(SAMPLE_RATE)
    audio_file.writeframes(samples.tobytes())

print(f"Created {OUTPUT} ({DURATION} seconds)")
