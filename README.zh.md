# DeepSeek Harness

[English](README.md) | 中文

DeepSeek Harness（`dsh`）是由 [DeepSeek AI](https://deepseek.com) 开发的开源 agent harness（智能体框架）。

它构建于**一切皆插件**的架构之上，由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512)。

文档：[https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## 开发者预览

DeepSeek Harness 处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

运行本项目前，请阅读[安全说明](SAFETY.zh.md)。

<a id="run"></a>

## 运行

<a id="install-the-linux-desktop-app"></a>

### 安装 Linux 桌面应用

本 fork 的 [`desktop-v0.2.0-rc.2` release](https://github.com/ZacharyZhang-NY/deepseek-harness/releases/tag/desktop-v0.2.0-rc.2) 为 x86_64 Linux 打包了 DeepSeek Harness Desktop。它是非官方、未签名的构建，不支持自动更新。运行对应发行版的命令，然后从应用启动器打开 **DeepSeek Harness**，或运行 `deepseek-harness`。

Arch Linux 和 Omarchy：

```sh
sudo pacman -U https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-desktop-bin-0.2.0rc.2-1-x86_64.pkg.tar.zst
```

如需改为从 PKGBUILD 构建同一个包：

```sh
git clone -b linux https://github.com/ZacharyZhang-NY/deepseek-harness.git
cd deepseek-harness/apps/desktop/packaging/aur
makepkg -si
```

AUR 重新开放账户注册后，该包将以 `deepseek-harness-desktop-bin` 发布到 AUR。

Debian 和 Ubuntu：

```sh
curl -LO https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-0.2.0-rc.2-linux-amd64.deb
sudo apt install ./deepseek-harness-0.2.0-rc.2-linux-amd64.deb
```

Fedora：

```sh
sudo dnf install https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-0.2.0-rc.2-linux-x86_64.rpm
```

任意发行版，使用 AppImage（需要 FUSE 2，Arch 上为 `fuse2`，Debian 和 Ubuntu 上为 `libfuse2`）：

```sh
curl -LO https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/deepseek-harness-0.2.0-rc.2-linux-x86_64.AppImage
chmod +x deepseek-harness-0.2.0-rc.2-linux-x86_64.AppImage
./deepseek-harness-0.2.0-rc.2-linux-x86_64.AppImage
```

在 Omarchy 上，请将 设置 → 通用 → 外观 保持为 **跟随系统**（默认值）：应用会使用当前 Omarchy 主题的颜色和浅色/深色模式，并跟随每次 `omarchy-theme-set` 切换。所有文件的校验和见 [`SHA256SUMS`](https://github.com/ZacharyZhang-NY/deepseek-harness/releases/download/desktop-v0.2.0-rc.2/SHA256SUMS)。

### 通过 `npm` 运行

安装 `Node.js`，然后运行：

```sh
npx @deepseek-ai/dsh web
```

该命令默认会在 `http://127.0.0.1:3080` 启动 Web UI，本机启动时还会用默认浏览器打开页面。通过 SSH 启动时只打印宿主机 URL，因为本地转发地址由 SSH 客户端或编辑器持有。传入 `--no-open` 可仅运行服务器而不打开浏览器。详见 [Web UI 指南](docs/user/guide/index.zh.md)。

<a id="run-from-source"></a>

### 从源码运行

如需从仓库源码运行：

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` 会准备仓库产物。`pnpm dsh web` 会直接使用这些已构建产物，不会重新构建。

## 社区与支持

- 通过 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 提交反馈或 bug 报告。
- 为你的插件仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。
- 欢迎加入 DeepSeek Harness 企微群！扫描下方二维码填写入群问卷，小助手会定期发送入群邀请。

<table>
  <thead>
    <tr>
      <th align="center">入群问卷</th>
      <th align="center">微信公众号</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="https://cdn.deepseek.com/harness/readme/community-wecom-survey.png" alt="DeepSeek Harness 入群问卷二维码" width="180" height="180"></a></td>
      <td align="center"><img src="https://cdn.deepseek.com/harness/readme/community-wechat-official-account.png" alt="DeepSeek Harness 团队微信公众号二维码" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

`pnpm run dev:web` 会在一个终端里完成构建、启动，并在源码修改时重建 client bundle；`make help` 列出 Web 与 Desktop 对应的 Make target。完整表格见开发指南的「应用命令」一节。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 引用

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
