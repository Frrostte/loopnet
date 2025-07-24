function App() {
  const [peers, setPeers] = React.useState([]);
  const [file, setFile] = React.useState(null);
  const [status, setStatus] = React.useState('');

  // Fetch discovered peers
  const loadPeers = async () => {
    try {
      const res = await fetch('/peers');
      const data = await res.json();
      setPeers(data);
    } catch (err) {
      console.error('Error fetching peers:', err);
    }
  };

  React.useEffect(() => {
    loadPeers(); // initial load
    const interval = setInterval(loadPeers, 3000); // refresh every 3s
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setStatus('✅ File uploaded!');
      } else {
        setStatus('❌ Upload failed.');
      }
    } catch (e) {
      setStatus('⚠️ Upload error: ' + e.message);
    }
  };

  return (
    <div className="container">
      <h1>LoopNet - File Share</h1>

      <h2>Upload File</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <p>{status}</p>

      <hr />

      <h2>Discovered Peers</h2>
      <ul className="peer-list">
        {peers.length === 0 ? (
          <li className="empty-message">No peers yet.</li>
        ) : (
          peers.map(peer => (
            <li key={peer.id} className="peer-card">
              <div className="peer-id">Peer {peer.id}</div>
              <div className="peer-ip">IP: {peer.address}</div>
              <div className="peer-files">
                <strong>Shared Files:</strong>
                {peer.files && peer.files.length > 0 ? (
                  <ul>
                    {peer.files.map((file, i) => (
                      <li key={i}>
                        <a
                          href={`http://${peer.address}:${peer.port}/files/${encodeURIComponent(file.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No shared files</div>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
