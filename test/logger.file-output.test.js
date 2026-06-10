import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'stream';
import Logger from '../lib/logger.js';

function makeCapture() {
  const stream = new PassThrough();
  const chunks = [];
  stream.on('data', (chunk) => chunks.push(chunk));
  const read = () => Buffer.concat(chunks).toString();
  return { stream, read };
}

describe('file output via stream option', () => {
  it('default (no stream) routes to console, not a stream', () => {
    const { stream } = makeCapture();
    const writeSpy = mock.method(stream, 'write');
    const logSpy = mock.method(console, 'log', () => {});
    try {
      const logger = new Logger({ level: 'info' });
      logger.info('console message');
      assert.equal(writeSpy.mock.calls.length, 0);
      assert.ok(logSpy.mock.calls.length > 0);
    } finally {
      logSpy.mock.restore();
    }
  });

  it('stream option writes to the stream', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ stream });
    logger.info('hello stream');
    stream.end();
    assert.ok(read().includes('hello stream'));
  });

  it('stream output ends with a newline', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ stream });
    logger.info('newline check');
    stream.end();
    assert.ok(read().endsWith('\n'));
  });

  it('stream output contains no ANSI color codes', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ stream });
    logger.error('no colors here');
    stream.end();
    assert.ok(!read().includes('\x1b['));
  });

  it('JSON format written to stream is valid JSON', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ format: 'json', stream });
    logger.info('json test');
    stream.end();
    const line = read().trimEnd();
    assert.doesNotThrow(() => JSON.parse(line));
    const parsed = JSON.parse(line);
    assert.equal(parsed.msg, 'json test');
  });

  it('simple format written to stream matches expected pattern', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ format: 'simple', stream });
    logger.info('simple test');
    stream.end();
    assert.match(read(), /\[INFO \] simple test/);
  });

  it('level filtering still applies with stream', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ level: 'warn', stream });
    logger.debug('filtered out');
    logger.info('also filtered');
    logger.warn('passes through');
    stream.end();
    assert.ok(!read().includes('filtered out'));
    assert.ok(!read().includes('also filtered'));
    assert.ok(read().includes('passes through'));
  });

  it('caller info included in stream output when level meets callerLevel', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ format: 'json', callerLevel: 'warn', stream });
    logger.error('with caller');
    stream.end();
    const parsed = JSON.parse(read().trimEnd());
    assert.ok('callerFile' in parsed);
    assert.ok('callerLine' in parsed);
  });

  it('caller info excluded from stream output below callerLevel', () => {
    const { stream, read } = makeCapture();
    const logger = new Logger({ format: 'json', callerLevel: 'warn', stream });
    logger.info('without caller');
    stream.end();
    const parsed = JSON.parse(read().trimEnd());
    assert.ok(!('callerFile' in parsed));
  });

  it('invalid stream option throws in constructor', () => {
    assert.throws(
      () => new Logger({ stream: 'not-a-stream' }),
      /stream option must be a Writable stream/
    );
  });

  it('stream error event is handled gracefully — does not throw', () => {
    const stream = new PassThrough();
    const stderrChunks = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk) => {
      stderrChunks.push(chunk.toString());
      return true;
    };
    try {
      new Logger({ stream });
      assert.doesNotThrow(() => stream.emit('error', new Error('disk full')));
      const stderrOutput = stderrChunks.join('');
      assert.ok(stderrOutput.includes('disk full'));
    } finally {
      process.stderr.write = originalWrite;
    }
  });

  it('stream: null behaves identically to no stream — uses console', () => {
    const logSpy = mock.method(console, 'log', () => {});
    try {
      const logger = new Logger({ stream: null });
      logger.info('null stream test');
      assert.ok(logSpy.mock.calls.length > 0);
    } finally {
      logSpy.mock.restore();
    }
  });
});
