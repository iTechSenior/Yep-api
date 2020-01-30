import { Router, Response, Request } from 'express';
import { CustomRequest } from '../helpers/interfaces';
import PDFDocument from 'pdfkit';
import * as certs from '../helpers/certificates';
import { findIndex } from 'lodash';
const express = require('express');
const SVGtoPDF = require('svg-to-pdfkit');
const router = express.Router();

interface CertObj {
  id: string;
  value: string;
}

const CertificateIdTranslation = {
  '1-A': 'certificate1A',
  '3-A': 'certificate3A',
  '4-A': 'certificate4A',
  '5-A': 'certificate5A',
  '6-A': 'certificate6A',
  '34-A': 'certificate34A',
  '35-A': 'certificate35A',
  '36-A': 'certificate36A',
  '37-A': 'certificate37A',
  '38-A': 'certificate38A',
  '39-A': 'certificate39A ',
  '40-A': 'certificate40A',
  '41-A': 'certificate41A',
  '42-A': 'certificate42A',
};
const getCertID = (id: string) => {
  switch (id) {
    case '1-A':
      return 'certificate1A';
    case '3-A':
      return 'certificate3A';
    case '4-A':
      return 'certificate4A';
    case '5-A':
      return 'certificate5A';
    case '6-A':
      return 'certificate6A';
    case '34-A':
      return 'certificate34A';
    case '35-A':
      return 'certificate35A';
    case '36-A':
      return 'certificate36A';
    case '37-A':
      return 'certificate37A';
    case '38-A':
      return 'certificate38A';
    case '39-A':
      return 'certificate39A';
    case '40-A':
      return 'certificate40A';
    case '41-A':
      return 'certificate41A';
    case '42-A':
      return 'certificate42A';
  }
};
interface CertObj {
  certificateId: string;
  base64: string;
  svg: string;
}

router.get('/certificates', async (req: CustomRequest, res: Response) => {
  const doc = new PDFDocument();
  res.statusCode = 200;
  res.setHeader('Content-type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-disposition', 'attachment; filename=Untitled.pdf');

  const certificate = certs[getCertID(req.query.id)];
  // console.log('certificate', certificate ? certificate.certificateId : 'Not Loaded');
  doc.image(certificate.base64, -2, 0, { fit: [640, 791] });

  SVGtoPDF(doc, certificate.svg, 25, 590, { width: 390, preserveAspectRatio: 'xMinYMin meet' });
  doc
    .text(`Referral Code: ${req.user.userName}`, 25, 740, {
      // .text(`Referral Code: ${req.user.userName}`, 25, 740, {
      height: 10,
    })

    .text(`Certificate Code: ${req.query.id}`, 25, 760, {
      height: 10,
    })

    .text(`Go Redeem: http://redeem.tripvalet.com`, 25, 705, {
      height: 10,
    });

  doc.pipe(res);
  doc.end();
});

export default router;
