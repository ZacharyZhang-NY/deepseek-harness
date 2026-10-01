# DeepSeek Harness

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## Developer preview

DeepSeek Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Install the Linux desktop app

The [`desktop-v0.2.0-rc.2` release](https://github.com/ZacharyZhang-NY/deepseek-harness/releases/tag/desktop-v0.2.0-rc.2) of this fork packages DeepSeek Harness Desktop for x86_64 Linux. It is an unofficial, unsigned build without automatic updates. Run the commands for your distribution, then start **DeepSeek Harness** from the application launcher or with `deepseek-harness`.

Arch Linux and Omarchy:

```sh
sudo pacman -U https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-desktop-bin-0.2.0rc.2-1-x86_64.pkg.tar.zst
```

To build the same package from its PKGBUILD instead:

```sh
git clone -b linux https://github.com/ZacharyZhang-NY/deepseek-harness.git
cd deepseek-harness/apps/desktop/packaging/aur
makepkg -si
```

The package will be published to the AUR as `deepseek-harness-desktop-bin` once AUR account registration reopens.

Debian and Ubuntu:

```sh
curl -LO https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-0.2.0-rc.2-linux-amd64.deb
sudo apt install ./deepseek-harness-0.2.0-rc.2-linux-amd64.deb
```

Fedora:

```sh
sudo dnf install https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-0.2.0-rc.2-linux-x86_64.rpm
```

Any distribution, as an AppImage (requires FUSE 2, packaged as `fuse2` on Arch and `libfuse2` on Debian and Ubuntu):

```sh
curl -LO https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-0.2.0-rc.2-linux-x86_64.AppImage
chmod +x deepseek-harness-0.2.0-rc.2-linux-x86_64.AppImage
./deepseek-harness-0.2.0-rc.2-linux-x86_64.AppImage
```

On Omarchy, keep Settings → General → Appearance on **System** (the default): the app then uses the active Omarchy theme's colors and light or dark mode, and follows every `omarchy-theme-set` switch. Checksums for every file are in [`SHA256SUMS`](https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/SHA256SUMS).

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/4MrtZUhpxg">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:web` builds, serves, and rebuilds client bundles on source edits in one terminal, and `make help` lists the matching Make targets for Web and Desktop; the guide's application commands section owns the full table.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
