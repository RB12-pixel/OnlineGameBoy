export class MMU {
    constructor() {
        this.rom = new Uint8Array(0x10000);
        this.vram = new Uint8Array(0x2000);
        this.wram = new Uint8Array(0x2000);
        this.io = new Uint8Array(0x80);
    }

    loadROM(romData) {
        this.rom.set(romData);
    }

    read8(addr) {
        addr &= 0xFFFF;
        if (addr < 0x8000) return this.rom[addr];
        if (addr >= 0x8000 && addr < 0xA000) return this.vram[addr - 0x8000];
        if (addr >= 0xC000 && addr < 0xE000) return this.wram[addr - 0xC000];
        if (addr >= 0xFF00 && addr < 0xFF80) return this.io[addr - 0xFF00];
        return 0;
    }

    write8(addr, val) {
        addr &= 0xFFFF;
        val &= 0xFF;
        if (addr >= 0x8000 && addr < 0xA000) {
            this.vram[addr - 0x8000] = val;
        } else if (addr >= 0xC000 && addr < 0xE000) {
            this.wram[addr - 0xC000] = val;
        } else if (addr >= 0xFF00 && addr < 0xFF80) {
            this.io[addr - 0xFF00] = val;
        }
    }
}
