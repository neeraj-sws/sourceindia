import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";

const KnowledgeCenter = () => {
  const [knowledgeCenter, setKnowledgeCenter] = useState([]);

  useEffect(() => {
    const fetchKnowledgeCenter = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/knowledge_center`);
        setKnowledgeCenter(res.data);
      } catch (err) {
        console.error("Error fetching knowledge center:", err);
      }
    };
    fetchKnowledgeCenter();
  }, []);

  return (
    <section className="my-5">
      <div className="container">
        <div className="card mb-5 commonHead border shodow-none">
          <div className="card-body py-5 d-flex align-items-center justify-content-center">
            <div className="firstHead text-center">
              <h1 className="mb-0 text-white">Knowledge sessions for the Electronics Industry</h1>
            </div>
          </div>
        </div>
        <div className="knowledgeBox">
          <div className="row">
            {knowledgeCenter
              .filter((item) => item.is_delete === 0 && item.status === 1)
              .map((item, index) => (
                <div className="col-lg-4 col-sm-6 mb-4" key={index}>
                  <div className="ContentBox bg-white shadow-sm border">
                    <div className="innervideo">
                      <ImageFront
                        src={`${ROOT_URL}/${item.file_name}`}
                        width={180}
                        height={180}
                        showFallback={true}
                      />
                    </div>
                    <div className="videobox">
                      <div className="p-3">
                        <p className="">{item.name}</p>
                        <Link to={item.video_url} className="btn btn-sm btn-primary w-100" target="_blank">
                          View ➜
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default KnowledgeCenter;
