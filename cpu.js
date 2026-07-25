export class CPU {
    constructor(mmu) {
        this.mmu = mmu;
        this.a = 0; this.f = 0; 
        this.b = 0; this.c = 0;
        this.d = 0; this.e = 0; 
        this.h = 0; this.l = 0;
        this.pc = 0x0100; 
        this.sp = 0xFFFE;
    }
    
    get flagZ() { return (this.f & 0x80) !== 0; }
    set flagZ(v) { this.f = v ? (this.f | 0x80) : (this.f & ~0x80); }
    get flagN() { return (this.f & 0x40) !== 0; }
    set flagN(v) { this.f = v ? (this.f | 0x40) : (this.f & ~0x40); }
    get flagH() { return (this.f & 0x20) !== 0; }
    set flagH(v) { this.f = v ? (this.f | 0x20) : (this.f & ~0x20); }
    get flagC() { return (this.f & 0x10) !== 0; }
    set flagC(v) { this.f = v ? (this.f | 0x10) : (this.f & ~0x10); }

    push16(val) {
        this.sp = (this.sp - 1) & 0xFFFF;
        this.mmu.write8(this.sp, (val >> 8) & 0xFF);
        this.sp = (this.sp - 1) & 0xFFFF;
        this.mmu.write8(this.sp, val & 0xFF);
    }

    pop16() {
        const low = this.mmu.read8(this.sp);
        this.sp = (this.sp + 1) & 0xFFFF;
        const high = this.mmu.read8(this.sp);
        this.sp = (this.sp + 1) & 0xFFFF;
        return (high << 8) | low;
    }

    step() {
        const opcode = this.mmu.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;

        switch (opcode) {
            case 0x00: return 4;
            case 0xC3: 
                {
                    const low = this.mmu.read8(this.pc);
                    const high = this.mmu.read8((this.pc + 1) & 0xFFFF);
                    this.pc = (high << 8) | low;
                }
                return 16;
            case 0xC2: 
                {
                    const low = this.mmu.read8(this.pc);
                    const high = this.mmu.read8((this.pc + 1) & 0xFFFF);
                    this.pc = (this.pc + 2) & 0xFFFF;
                    if (!this.flagZ) {
                        this.pc = (high << 8) | low;
                        return 16;
                    }
                }
                return 12;
            case 0xCD: 
                {
                    const low = this.mmu.read8(this.pc);
                    const high = this.mmu.read8((this.pc + 1) & 0xFFFF);
                    this.pc = (this.pc + 2) & 0xFFFF;
                    this.push16(this.pc);
                    this.pc = (high << 8) | low;
                }
                return 24;
            case 0xC9: 
                this.pc = this.pop16();
                return 16;
            case 0xAF: 
                this.a = 0;
                this.f = 0x80;
                return 4;
            case 0x3E: 
                this.a = this.mmu.read8(this.pc);
                this.pc = (this.pc + 1) & 0xFFFF;
                return 8;
            case 0xEA: 
                {
                    const low = this.mmu.read8(this.pc);
                    const high = this.mmu.read8((this.pc + 1) & 0xFFFF);
                    this.pc = (this.pc + 2) & 0xFFFF;
                    const addr = (high << 8) | low;
                    this.mmu.write8(addr, this.a);
                }
                return 16;
            case 0xFA: 
                {
                    const low = this.mmu.read8(this.pc);
                    const high = this.mmu.read8((this.pc + 1) & 0xFFFF);
                    this.pc = (this.pc + 2) & 0xFFFF;
                    const addr = (high << 8) | low;
                    this.a = this.mmu.read8(addr);
                }
                return 16;
            case 0x21: 
                {
                    this.l = this.mmu.read8(this.pc);
                    this.h = this.mmu.read8((this.pc + 1) & 0xFFFF);
                    this.pc = (this.pc + 2) & 0xFFFF;
                }
                return 12;
            case 0x31: 
                {
                    const low = this.mmu.read8(this.pc);
                    const high = this.mmu.read8((this.pc + 1) & 0xFFFF);
                    this.sp = (high << 8) | low;
                    this.pc = (this.pc + 2) & 0xFFFF;
                }
                return 12;
            case 0x06: this.b = this.mmu.read8(this.pc); this.pc = (this.pc + 1) & 0xFFFF; return 8;
            case 0x0E: this.c = this.mmu.read8(this.pc); this.pc = (this.pc + 1) & 0xFFFF; return 8;
            case 0x16: this.d = this.mmu.read8(this.pc); this.pc = (this.pc + 1) & 0xFFFF; return 8;
            case 0x1E: this.e = this.mmu.read8(this.pc); this.pc = (this.pc + 1) & 0xFFFF; return 8;
            case 0x26: this.h = this.mmu.read8(this.pc); this.pc = (this.pc + 1) & 0xFFFF; return 8;
            case 0x2E: this.l = this.mmu.read8(this.pc); this.pc = (this.pc + 1) & 0xFFFF; return 8;
            case 0x77: 
                {
                    const addr = (this.h << 8) | this.l;
                    this.mmu.write8(addr, this.a);
                }
                return 8;
            case 0x23: 
                {
                    let hl = ((this.h << 8) | this.l) + 1;
                    this.h = (hl >> 8) & 0xFF;
                    this.l = hl & 0xFF;
                }
                return 8;
            case 0x05: 
                this.b = (this.b - 1) & 0xFF;
                this.flagZ = (this.b === 0);
                this.flagN = true;
                return 4;
            case 0x20: 
                {
                    const offset = this.mmu.read8(this.pc);
                    this.pc = (this.pc + 1) & 0xFFFF;
                    if (!this.flagZ) {
                        let signedOffset = offset > 127 ? offset - 256 : offset;
                        this.pc = (this.pc + signedOffset) & 0xFFFF;
                        return 12;
                    }
                }
                return 8;
            case 0x18: 
                {
                    const offset = this.mmu.read8(this.pc);
                    this.pc = (this.pc + 1) & 0xFFFF;
                    let signedOffset = offset > 127 ? offset - 256 : offset;
                    this.pc = (this.pc + signedOffset) & 0xFFFF;
                }
                return 12;
            default:
                return 4;
        }
    }
}
