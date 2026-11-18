# 给运维救急用的最小命令清单

事故现场不要翻长文档。把这几条复制到终端，按顺序跑，每步都留下输出。

```
# 1. 先留证据，别急着动任何东西
cp app.log app.log.$(date +%Y%m%d-%H%M%S).bak

# 2. 我在哪、磁盘满了没
pwd; df -h; du -sh ./* 2>/dev/null | sort -h | tail -10

# 3. 进程还活着吗、谁启的
ps aux | grep -E 'python|gunicorn|uvicorn' | grep -v grep

# 4. 从日志里捞错误（前后各看几行，别只看最后一行）
grep -n -C3 'ERROR\|Traceback\|Exception' app.log | tail -80

# 5. 本机服务通不通（--noproxy 是关键，否则会被代理转成 502）
curl -v --noproxy '*' http://127.0.0.1:8080/health

# 6. 定时任务到底配没配
crontab -l 2>/dev/null

# 7. systemd 服务最近一小时的输出
journalctl -u myapp --since '1 hour ago' --no-pager | tail -60
```

每条命令解决一个具体问题，不要一次全贴完 —— 边跑边判断，看到异常就停下来记证据。

**边界**：这份清单不教你 Linux 管理，只保证你在半夜被叫醒时不会手足无措。真正定位问题还是要回到代码、日志和监控曲线。
