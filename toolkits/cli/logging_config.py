"""日志配置：按级别输出，支持文件轮转，不在库代码里 print。"""
from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path


def setup_logging(name="daily_report", log_dir="logs", level=logging.INFO):
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(level)
    logger.propagate = False

    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")

    stream = logging.StreamHandler()
    stream.setFormatter(fmt)
    logger.addHandler(stream)

    Path(log_dir).mkdir(parents=True, exist_ok=True)
    rotating = RotatingFileHandler(
        Path(log_dir) / (name + ".log"),
        maxBytes=1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    rotating.setFormatter(fmt)
    logger.addHandler(rotating)
    return logger
