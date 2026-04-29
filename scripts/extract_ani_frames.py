from pathlib import Path
import struct
import sys


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def iter_chunks(data, start, end):
    pos = start
    while pos + 8 <= end:
        chunk_id = data[pos:pos + 4]
        size = struct.unpack_from("<I", data, pos + 4)[0]
        payload_start = pos + 8
        payload_end = payload_start + size
        yield chunk_id, data[payload_start:payload_end]
        pos = payload_end + (size % 2)


def extract_icon_chunks(data):
    if data[:4] != b"RIFF" or data[8:12] != b"ACON":
        raise ValueError("Input is not a RIFF ACON animated cursor.")

    for chunk_id, payload in iter_chunks(data, 12, len(data)):
        if chunk_id == b"icon":
            yield payload
        elif chunk_id == b"LIST" and payload[:4] == b"fram":
            yield from (
                nested_payload
                for nested_id, nested_payload in iter_chunks(payload, 4, len(payload))
                if nested_id == b"icon"
            )


def extract_png_from_cur(cur_data):
    if len(cur_data) < 6:
        return None

    reserved, cursor_type, count = struct.unpack_from("<HHH", cur_data, 0)
    if reserved != 0 or cursor_type not in (1, 2) or count == 0:
        return cur_data if cur_data.startswith(PNG_SIGNATURE) else None

    directory_size = 6 + count * 16
    for i in range(count):
        entry_offset = 6 + i * 16
        if entry_offset + 16 > len(cur_data):
            continue

        bytes_in_res = struct.unpack_from("<I", cur_data, entry_offset + 8)[0]
        image_offset = struct.unpack_from("<I", cur_data, entry_offset + 12)[0]
        image = cur_data[image_offset:image_offset + bytes_in_res]
        if image.startswith(PNG_SIGNATURE):
            return image

    payload = cur_data[directory_size:]
    signature_index = payload.find(PNG_SIGNATURE)
    if signature_index >= 0:
        return payload[signature_index:]

    return None


def main():
    if len(sys.argv) != 3:
        print("Usage: extract_ani_frames.py input.ani output_dir", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    output_dir.mkdir(parents=True, exist_ok=True)

    frames = []
    for index, icon_data in enumerate(extract_icon_chunks(input_path.read_bytes())):
        png = extract_png_from_cur(icon_data)
        if png is None:
            continue

        frame_path = output_dir / f"cursor-frame-{index:02d}.png"
        frame_path.write_bytes(png)
        frames.append(frame_path)

    if not frames:
        raise ValueError("No PNG frames found in animated cursor.")

    print("\n".join(str(path) for path in frames))


if __name__ == "__main__":
    raise SystemExit(main())
