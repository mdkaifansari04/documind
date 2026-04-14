from actian_vectorai import VectorAIClient, VectorParams, Distance, PointStruct

with VectorAIClient("localhost:50051") as client:
    # Health check
    info = client.health_check()
    print(f"Connected to {info['title']} v{info['version']}")

    # Create collection
    client.collections.create(
        "products",
        vectors_config=VectorParams(size=128, distance=Distance.Cosine),
    )

    # Insert points
    client.points.upsert("products", [
        PointStruct(id=1, vector=[0.1] * 128, payload={"name": "Widget"}),
        PointStruct(id=2, vector=[0.2] * 128, payload={"name": "Gadget"}),
        PointStruct(id=3, vector=[0.3] * 128, payload={"name": "Gizmo"}),
    ])

    # Search
    results = client.points.search("products", vector=[0.15] * 128, limit=5)
    for r in results:
        print(f"  id={r.id}  score={r.score:.4f}  payload={r.payload}")

    # Clean up
    client.collections.delete("products")