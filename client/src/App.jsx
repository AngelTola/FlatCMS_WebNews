import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function TarjetaNoticia({ post }) {
  const [expandido, setExpandido] = useState(false);
  const [contenidoCompleto, setContenidoCompleto] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarClick = () => {
    if (expandido) {
      setExpandido(false);
      return;
    }

    if (!contenidoCompleto) {
      setCargando(true);
      fetch(`http://localhost:3001/api/posts/${post.id}`)
        .then(res => res.json())
        .then(data => {
          setContenidoCompleto(data.contenido);
          setCargando(false);
          setExpandido(true);
        })
        .catch(err => {
          console.error("Error", err);
          setCargando(false);
        });
    } else {
      setExpandido(true);
    }
  };

  return (
    <article className="tarjeta-noticia">
      {post.imagen && (
        <img src={`http://localhost:3001/img/${post.imagen}`} alt={post.titulo} className="imagen-noticia" />
      )}
      <div className="contenido-noticia">
        <span className="fecha-noticia">{post.fecha}</span>
        <h2>{post.titulo}</h2>
        
        <div className="texto-noticia">
          {expandido ? (
            <div className="texto-markdown">
              {cargando ? <p>Cargando...</p> : <ReactMarkdown>{contenidoCompleto}</ReactMarkdown>}
            </div>
          ) : (
            <p>{post.resumen}</p>
          )}
        </div>
        <button className="btn-leer-mas" onClick={manejarClick}>
          {expandido ? 'Ocultar' : 'Ver mas'}
        </button>
      </div>
    </article>
  );
}

function PanelAdmin({ volver, posts, refrescarNoticias }) {
  const [clave, setClave] = useState('');
  const [autorizado, setAutorizado] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState('lista');
  const [mensaje, setMensaje] = useState('');

  const [idEditando, setIdEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenActual, setImagenActual] = useState(null);

  if(!autorizado){
    return (
      <div className="panel-admin-login">
        <h2>Area Restringida 🔒</h2>
        <input type="password" placeholder="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} className="input-admin" />
        <button className="btn-leer-mas" onClick={() => clave === 'secreto' ? setAutorizado(true) : alert('Clave incorrecta')}>Entrar</button>
        <button className="btn-cancelar" onClick={volver}>Cancelar</button>
      </div>
    );
  }

  const manejarEliminar = async (id) => {
    if (window.confirm('¿Estas seguro de que quieres eliminar esta noticia?')) {
      await fetch(`http://localhost:3001/api/posts/${id}`, { method: 'DELETE' });
      refrescarNoticias();
    }
  };

  const prepararEdicion = async (id) => {
    setMensaje('Cargando datos...');
    const res = await fetch(`http://localhost:3001/api/posts/${id}`);
    const data = await res.json();
    
    setIdEditando(data.id);
    setTitulo(data.titulo);
    setContenido(data.contenido);
    setImagenActual(data.imagen);
    setImagen(null);
    setMensaje('');
    setVistaAdmin('formulario');
  };

  const prepararCreacion = () => {
    setIdEditando(null); setTitulo(''); setContenido(''); setImagen(null); setImagenActual(null);
    setVistaAdmin('formulario');
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setMensaje(idEditando ? 'Actualizando...' : 'Publicando...');

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('contenido', contenido);
    if (imagen) formData.append('imagen', imagen);
    if (imagenActual) formData.append('imagenActual', imagenActual);

    const url = idEditando ? `http://localhost:3001/api/posts/${idEditando}` : 'http://localhost:3001/api/posts';
    const metodo = idEditando ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, { method: metodo, body: formData });
      if (response.ok) {
        setMensaje('¡Listo!');
        refrescarNoticias();
        setTimeout(() => { setVistaAdmin('lista'); setMensaje(''); }, 1500);
      }
    } catch (error) {
      setMensaje('Error en el servidor.');
    }
  };

  if (vistaAdmin === 'lista') {
    return (
      <div className="formulario-admin">
        <h2>Panel de Control ⚙️</h2>
        <button className="btn-leer-mas" onClick={prepararCreacion} style={{marginBottom: '1.5rem', backgroundColor: '#2e7d32'}}>+ Crear Nueva Noticia</button>
        
        <ul style={{listStyle: 'none', padding: 0}}>
          {posts.map(post => (
            <li key={post.id} style={{borderBottom: '1px solid #ddd', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontWeight: 'bold', color: '#333'}}>{post.titulo}</span>
              <div style={{display: 'flex', gap: '10px'}}>
                <button className="btn-accion btn-editar" onClick={() => prepararEdicion(post.id)}>✏️</button>
                <button className="btn-accion btn-eliminar" onClick={() => manejarEliminar(post.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
        <button className="btn-cancelar" onClick={volver} style={{marginTop: '2rem'}}>Salir del Panel</button>
      </div>
    );
  }
  return (
    <form className="formulario-admin" onSubmit={manejarEnvio}>
      <h2>{idEditando ? 'Editar Noticia ✏️' : 'Publicar Noticia ✍️'}</h2>
      
      <label>Título de la noticia:</label>
      <input type="text" required className="input-admin" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

      <label>Contenido (Markdown):</label>
      <textarea required className="textarea-admin" rows="8" value={contenido} onChange={(e) => setContenido(e.target.value)} />

      <label>Imagen de portada {idEditando && '(Deja vacio para no cambiarla)'}:</label>
      <input type="file" accept="image/*" className="file-admin" required={!idEditando} onChange={(e) => setImagen(e.target.files[0])} />

      <button type="submit" className="btn-leer-mas" style={{marginTop: '1rem'}}>{idEditando ? 'Guardar Cambios' : 'Publicar Ahora'}</button>
      <button type="button" className="btn-cancelar" onClick={() => setVistaAdmin('lista')}>Cancelar</button>
      
      {mensaje && <p className="mensaje-feedback">{mensaje}</p>}
    </form>
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [vista, setVista] = useState('inicio');

  const cargarNoticias = () => {
    fetch('http://localhost:3001/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data.posts))
      .catch(error => console.error('Error:', error));
  };

  useEffect(() => {
    cargarNoticias();
  }, []);
  
  return (
    <div className="App">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{width: '24px'}}></div>
        <h1>Noticias</h1>
        <button 
          onClick={() => setVista(vista === 'inicio' ? 'admin' : 'inicio')} 
          style={{background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem'}}
        >
          ⚙️
        </button>
      </header>
      
      <main className="contenedor-noticias">
        {vista === 'inicio' ? (
          posts.length > 0 ? (
            posts.map((post) => <TarjetaNoticia key={post.id} post={post} />)
          ) : <p>Cargando noticias...</p>
        ) : (
          <PanelAdmin volver={() => setVista('inicio')} posts={posts} refrescarNoticias={cargarNoticias} />
        )}
      </main>
    </div>
  );
}

export default App;