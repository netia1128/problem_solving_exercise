function getObject(s3Path, offsetByte, numBytes) {
  const data = `
{"type": "1", "on": "#submitBtn", "time": 123547362}
{"type": "2", "on": "#cancelBtn", "time": 123547445}
{"type": "3", "on": "#helpText", "time": 123549285}
{"type": "4", "on": "#submitBtn", "time": 123547362}
{"type": "5", "on": "#cancelBtn", "time": 123547445}
{"type": "6", "on": "#helpText", "time": 123549285}
{"type": "7", "on": "#submitBtn", "time": 123547362}
{"type": "8", "on": "#cancelBtn", "time": 123547445}
{"type": "9", "on": "#helpText", "time": 123549285}
{"type": "10", "on": "#helpText", "time": 123549285}
`.trim();

return data.slice(offsetByte, offsetByte + numBytes);
}

class S3LineReader {
  constructor(s3Path) {
    this.dataToProcess = '';
    this.numBytes = 10000;
    this.offsetByte = 0;
    this.s3Path = '';
    this.allDataProcessed = false;
  }

  // Returns the next line of the S3 file, or null if there are no more lines.
  next() {
    // Short circuit when allDataProcessed is true
    if (this.allDataProcessed) return null;

    const indexOfLineBreak = this.dataToProcess.indexOf(`\n`);

    // If whatever data we're processing doesnt have a line break, go get more data
    if (indexOfLineBreak === -1) {
      this.fetchData()
      return this.next();
    // And if the line break happens to be at the beginning of the string, chop it off and reprocess
    } else if (indexOfLineBreak === 0) {
      this.dataToProcess = this.dataToProcess.slice(indexOfLineBreak + 1);
      return this.next();
    }

    // Any value living between line breaks is a complete log
    const log = this.dataToProcess.slice(0, indexOfLineBreak);

    // Remove your complete log from the dataToProcess string
    this.dataToProcess = this.dataToProcess.slice(indexOfLineBreak);

    return log;
  }

  
  fetchData() {
    const newData = getObject(this.s3Path, this.offsetByte, this.numBytes);

    // If we fetch new data, append it to the dataToProcess string and ratchet up offsetBytes
    // Otherwise, if no data is fetched, note that all data has been processed
    if(newData.length) {
      this.dataToProcess = this.dataToProcess += newData;
      this.offsetByte += this.numBytes;
    } else {
      this.allDataProcessed = true;
    }
  }
}

// Usage example
const reader = new S3LineReader('s3://mybucket/event_log');
while (true) {
  const line = reader.next();
  if (line === null) {
    break;
  }
  console.log(line);
}