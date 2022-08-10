// GENVID - class used for the reconnection logic start
class Fibonacci {
    constructor() {
      this.reset();
    }
    reset() {
      this.first = 0;
      this.second = 1;
    }
    next() {
      const next = this.first + this.second;
      this.first = this.second;
      this.second = next;
      return next;
    }
    get() {
      return this.first + this.second;
    }
  }
  // GENVID - class used for the reconnection logic stop

  export default Fibonacci;