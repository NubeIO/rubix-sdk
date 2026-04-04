package processctl

// ring is a fixed-size ring buffer of strings for log capture.
type ring struct {
	buf  []string
	size int
	idx  int
	full bool
}

func newRing(n int) *ring {
	if n <= 0 {
		n = 200
	}
	return &ring{buf: make([]string, n), size: n}
}

func (r *ring) add(s string) {
	r.buf[r.idx] = s
	r.idx = (r.idx + 1) % r.size
	if r.idx == 0 {
		r.full = true
	}
}

func (r *ring) all() []string {
	if !r.full {
		return append([]string{}, r.buf[:r.idx]...)
	}
	out := make([]string, 0, r.size)
	out = append(out, r.buf[r.idx:]...)
	out = append(out, r.buf[:r.idx]...)
	return out
}

// tail returns up to n most recent entries (newest last).
func (r *ring) tail(n int) []string {
	all := r.all()
	if n <= 0 || n >= len(all) {
		return all
	}
	return all[len(all)-n:]
}
