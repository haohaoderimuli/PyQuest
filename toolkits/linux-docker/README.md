# Linux、Docker 与依赖安全

在浏览器里写 Python 和在企业里维护一个脚本，差的是这一层：脚本半夜挂在别人机器上，你要能登上去看日志、复现环境、确认是不是依赖被人改了。这里给最小够用的手册，不冒充运维课程。

## Linux：只会这八条就够救急

| 命令 | 用来干嘛 |
| --- | --- |
| `pwd` / `cd` / `ls -la` | 我在哪、有什么、权限是什么 |
| `grep -n "ERROR" app.log \| tail -50` | 从日志里捞错误，带行号 |
| `ps aux \| grep python` | 进程还在不在、谁启的 |
| `df -h` / `du -sh *` | 磁盘是不是满了（常见的静默失败原因） |
| `curl -v --noproxy '*' http://127.0.0.1:8080/health` | 本机服务到底通不通 |
| `chmod +x run.sh` | 脚本没执行权限 |
| `crontab -l` | 定时任务到底配没配、几点跑 |
| `journalctl -u myapp --since "1 hour ago"` | systemd 服务的历史输出 |

**先别改任何东西。** 上线事故里最贵的动作是「顺手清一下日志」——证据没了，复盘只能靠猜。先 `cp app.log app.log.bak`，再看。

Windows 用户：Git Bash 就能练前六条；公司服务器通常是 Linux，迟早要用。`--noproxy '*'` 是本机访问的坑：环境代理会把 localhost 转成 502。

## Docker：把「我机器上是好的」变成可复现

三个概念，够用：

- **镜像（image）**：只读模板，Python 版本、系统库、依赖都锁在里面
- **容器（container）**：镜像跑起来的实例，每个容器互相隔离
- **卷（volume）**：容器里要持久化的目录，删容器不丢数据

最小 `Dockerfile`（同目录可下载）：

```
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "daily_report.py", "--help"]
```

跑法：

```
docker build -t daily-report .
docker run --rm daily-report                    # 跑完即删，最安全
docker run --rm -v "$PWD/out:/app/out" daily-report --input data/orders.csv --output out/report.json
```

`-v` 把本机目录挂进容器，输出才带得出来。不加卷，结果留在容器里，`--rm` 之后就没了。

关键纪律：**不要用 `latest` 标签**。今天构建和明天构建可能不是同一个 Python 版本。生产用固定版本 `python:3.13.2-slim`。

## 依赖安全：改一行 requirement 可能就是一次事故

三件事按顺序做：

1. **锁版本**：`requirements.txt` 写 `pandas==3.1.1`，不写 `pandas`。不锁版本，半年后 CI 装到不兼容的新版，代码没动但跑挂了。
2. **查已知漏洞**：`pip-audit` 扫一遍依赖有没有 CVE。没有这个工具就 `pip install pip-audit`，这是少数值得装的安全工具。
3. **分开提交**：依赖升级单独一次 commit，不和业务逻辑混在一起。挂了才知道该回滚哪个。

```
python -m pip install pip-audit --disable-pip-version-check
python -m pip-audit -r requirements.txt
```

有漏洞不等于立刻升级：先看影响面（这个包用在哪个功能）、有没有修复版、升级会不会破坏现有行为。**记录下来再决定**，别在事故当天顺手升级。

## 跑通判据

- [ ] 能从日志里捞出一条 ERROR 并说出前后发生了什么，而不是只看最后一行
- [ ] 用固定版本镜像 build 成功，容器里跑出与非容器一致的结果
- [ ] 知道 `-v` 的作用，能解释为什么不加卷输出会丢
- [ ] `pip-audit` 跑过一次，能说出发现了什么、准备怎么处理
- [ ] 依赖升级是单独一次提交，附了原因

## 常见坑

- `docker run` 没加 `--rm`，几天后一堆僵尸容器占满磁盘
- 在容器里改代码，重启镜像又变回去 —— 改的是容器层不是镜像层
- 看到 `pip-audit` 报漏洞就panic，立刻升级到最新版，结果引入-breaking change
- 日志只 `tail -f` 不看历史，事故发生在两小时前，你盯着实时空白流
- 用 root 跑容器里的服务，挂载了宿主目录后写出来的文件宿主改不动
