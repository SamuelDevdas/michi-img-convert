# ARW → JPEG Converter 📸


![License: MIT](https://img.shields.io/badge/license-MIT-green)


Batch‑converts Sony **.ARW** (or just about any RAW format LibRaw understands) into high‑quality JPEGs with a single command.

---

## ✨ Features

* 🔍 **Recursive or flat** conversion – grab everything in a tree or just one folder.
* 🗄️ **Multi‑source** support – convert several shoots in one run.
* 🎨 Uses **camera white‑balance** & skips auto‑brightening for faithful colours.
* 🏗️ Preserves the original folder structure under the output root.
* ⚡ Fast: powered by [`rawpy`](https://github.com/letmaik/rawpy) (LibRaw) + [`imageio`](https://github.com/imageio/imageio).

---

## 📦 Installation

### Via [uv](https://github.com/astral-sh/uv) (recommended)

First, clone the repository:
```bash
git clone https://github.com/your-username/michi-img-convert.git 
cd michi-img-convert
```

Then, install dependencies:
```bash
uv init                 # once per project
uv add rawpy imageio    # install dependencies
```

### Via plain `pip`

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install rawpy imageio
```

Clone or copy this repo and make the script executable:

```bash
chmod +x convert_arw_cli.py
```

---

## 🚀 Usage

### Basic

```bash
python convert_arw_cli.py --src /path/to/RAW --dst /path/to/JPG
```

### Convert multiple folders & recurse into sub‑folders

```bash
python convert_arw_cli.py   --src ~/Jobs/Wedding ~/Jobs/Portraits   --dst ~/JPEGs   --recurse
```

### Help

```bash
python convert_arw_cli.py --help
```

```
Batch‑convert Sony .ARW RAW files to JPEG.

options:
  -s, --src ...    source folder(s)
  -d, --dst PATH   destination root folder
  -r, --recurse    recurse into sub‑folders
```

---

## 📝 Project structure

```
.
├── convert_arw_cli.py   # main CLI script
├── convert_arw.py       # core conversion logic (used by CLI script)
└── README.md            # project documentation
```

---

## 🤝 Contributing

Bug reports and pull requests are welcome! Feel free to open an issue or submit a PR.

---

## 📜 License

This project is licensed under the MIT License – see [`LICENSE`](LICENSE) for details.
