import { Request, Response } from 'express';
import * as consultationService from '../services/consultation.service';
import * as walletService from '../services/wallet.service';
import { consultationListSchema } from '../validators/consultation.validator';
import { ok } from '../utils/response';

export async function start(req: Request, res: Response) {
    const { consultation, alreadyActive } = await consultationService.start(req.user!, req.body.expertId);
    const balancePaise = await walletService.getBalancePaise(req.user!.id);
    return ok(
        res,
        { consultation: consultationService.toConsultationDto(consultation), alreadyActive, balance: walletService.toRupees(balancePaise) },
        alreadyActive ? 'Consultation already active' : 'Consultation started',
        alreadyActive ? 200 : 201,
    );
}

export async function listMine(req: Request, res: Response) {
    const q = consultationListSchema.parse(req.query);
    return ok(res, { consultations: await consultationService.listMine(req.user!, q.status) });
}

export async function complete(req: Request, res: Response) {
    const c = await consultationService.complete(req.user!, String(req.params.id));
    return ok(res, consultationService.toConsultationDto(c), 'Consultation completed');
}