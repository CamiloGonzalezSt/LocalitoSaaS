from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
SLIDES = WORK / "slides"
SEGMENTS = WORK / "segments"
VIDEOS = ROOT / "videos_editados"
FFMPEG = ROOT / "tmp" / "video_tools" / "node_modules" / ".pnpm" / "ffmpeg-static@5.3.0" / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"
OUTPUT = ROOT / "entregables" / "Presentacion_Localito_Celular.mp4"


def run(*args: str) -> None:
    command = [str(FFMPEG), "-hide_banner", "-loglevel", "error", "-y", *args]
    subprocess.run(command, check=True)


def still(name: str, slide_number: int, duration: float) -> Path:
    output = SEGMENTS / f"{name}.mp4"
    run(
        "-loop", "1",
        "-framerate", "30",
        "-i", str(SLIDES / f"slide-{slide_number:02d}.png"),
        "-t", f"{duration:.3f}",
        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0xf7f4ed,format=yuv420p",
        "-r", "30",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "22",
        "-profile:v", "high",
        "-level", "3.1",
        "-an",
        str(output),
    )
    return output


def demo(name: str, source: Path, duration: float) -> Path:
    output = SEGMENTS / f"{name}.mp4"
    filter_graph = (
        "[0:v]scale=1280:720,boxblur=18:1,eq=brightness=-0.18[bg];"
        "[1:v]scale=-2:720[phone];"
        "[bg][phone]overlay=(W-w)/2:0,format=yuv420p[out]"
    )
    run(
        "-loop", "1",
        "-framerate", "30",
        "-i", str(SLIDES / "slide-06.png"),
        "-i", str(source),
        "-filter_complex", filter_graph,
        "-map", "[out]",
        "-t", f"{duration:.3f}",
        "-r", "30",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "22",
        "-profile:v", "high",
        "-level", "3.1",
        "-an",
        str(output),
    )
    return output


def main() -> None:
    if not FFMPEG.exists():
        raise FileNotFoundError(FFMPEG)

    if SEGMENTS.exists():
        shutil.rmtree(SEGMENTS)
    SEGMENTS.mkdir(parents=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    ordered = [
        still("01", 1, 7),
        still("02", 2, 11),
        still("03", 3, 10),
        still("04", 4, 12),
        still("05", 5, 8),
        still("06a", 6, 3),
        demo("06b-venta", VIDEOS / "01_Registrar_una_venta_Localito.mp4", 25.8),
        still("06c", 6, 2),
        demo("06d-control", VIDEOS / "02_Controlar_el_negocio_Localito.mp4", 46.567),
        still("06e", 6, 2.633),
        still("07", 7, 8),
        still("08", 8, 12),
        still("09", 9, 11),
        still("10", 10, 9),
    ]

    concat_file = WORK / "concat.txt"
    concat_file.write_text("".join(f"file '{path.as_posix()}'\n" for path in ordered), encoding="utf-8")
    silent_video = WORK / "presentation-silent.mp4"
    run("-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(silent_video))
    run(
        "-i", str(silent_video),
        "-f", "lavfi",
        "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "96k",
        "-shortest",
        "-movflags", "+faststart",
        str(OUTPUT),
    )
    print(OUTPUT)


if __name__ == "__main__":
    main()
