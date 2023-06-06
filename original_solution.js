function getObject(s3Path, offsetByte, numBytes) {
  const data = `
{"type": "click", "on": "#submitBtn", "time": 123547362}
{"type": "click", "on": "#cancelBtn", "time": 123547445}
{"type": "hover", "on": "#helpText", "time": 123549285}
{"type": "1", "on": "#submitBtn", "time": 123547362}
{"type": "2", "on": "#cancelBtn", "time": 123547445}
{"type": "3", "on": "#helpText", "time": 123549285}
{"type": "4", "on": "#submitBtn", "time": 123547362}
{"type": "5", "on": "#cancelBtn", "time": 123547445}
{"type": "6", "on": "#helpText", "time": 123549285}
`.trim();

  return data.slice(offsetByte, offsetByte + numBytes);
}

class S3LineReader {
  constructor(s3Path) {
    this.s3Path = '';
    this.currentLineNum = 0;
    this.currentLineVal = '';
    this.fetchedData = [];
    this.lineFragment = null;
    this.offsetByte = 0;
    this.numBytes = 5;
  }

  // Returns the next line of the S3 file, or null if there are no more lines.
  next() {
    if (!this.fetchedData) return null;
    if (!this.fetchedData.length) this.fetchData();
    
    if(this.lineFragment) {
      this.currentLineVal = this.lineFragment + this.fetchedData[this.currentLineNum];

      if (this.currentLineVal.endsWith(`}`)) {
        this.lineFragment = null;
      } else {
        this.lineFragment = this.currentLineVal;
      }
    } else {
      this.currentLineVal = this.fetchedData[this.currentLineNum];
    }
    
    if(this.currentLineVal !== undefined 
      && this.currentLineVal !== ''
      && this.currentLineVal.endsWith(`}`)) {
      
      this.currentLineNum++;
      this.lineFragment = null;
      return this.currentLineVal;
    } else {
      this.lineFragment = this.currentLineVal;
      this.fetchData();
      this.currentLineNum = 0;
      return this.next();
    }
  }
  
  fetchData() {
    const rawData = getObject(this.s3Path, this.offsetByte, this.numBytes);
    rawData.length === 0 ? this.fetchedData = null : this.fetchedData = rawData.trim().split(`\n`);
    this.offsetByte += this.numBytes;
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